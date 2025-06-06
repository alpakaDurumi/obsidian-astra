import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf } from 'obsidian';

import triangleVertWGSL from './shaders/triangle.vert.wgsl';
import redFragWGSL from './shaders/red.frag.wgsl';

interface AstraSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: AstraSettings = {
	mySetting: 'default'
}

export const VIEW_TYPE_EXAMPLE = 'example-view';

export class ExampleView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_EXAMPLE;
	}

	getDisplayText() {
		return 'Example view';
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.createEl('h4', { text: 'Example view' });

		const adapter = await (navigator as any).gpu.requestAdapter();
		const device = await adapter?.requestDevice();

		const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

		// console.log("Electron version:", process.versions.electron);
		// console.log("Chromium version:", process.versions.chrome);
		// console.log("WebGPU Adapter:", adapter);
		// console.log("WebGPU Device:", device);

		const canvas = document.createElement('canvas');
		canvas.width = 640;
		canvas.height = 480;
		// document.body.appendChild(canvas);
		container.appendChild(canvas);

		const context = canvas.getContext('webgpu') as GPUCanvasContext;
		const format = (navigator as any).gpu.getPreferredCanvasFormat();

		context.configure({
			device,
			format: presentationFormat,
		});

		const pipeline = device.createRenderPipeline({
			layout: 'auto',
			vertex: {
				module: device.createShaderModule({
					code: triangleVertWGSL,
				}),
			},
			fragment: {
				module: device.createShaderModule({
					code: redFragWGSL,
				}),
				targets: [
					{
						format: presentationFormat,
					},
				],
			},
			primitive: {
				topology: 'triangle-list',
			},
		});

		function frame() {
			const commandEncoder = device.createCommandEncoder();
			const textureView = context.getCurrentTexture().createView();

			const renderPassDescriptor: GPURenderPassDescriptor = {
				colorAttachments: [
					{
						view: textureView,
						clearValue: [0, 0, 0, 0], // Clear to transparent
						loadOp: 'clear',
						storeOp: 'store',
					},
				],
			};

			const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
			passEncoder.setPipeline(pipeline);
			passEncoder.draw(3);
			passEncoder.end();

			device.queue.submit([commandEncoder.finish()]);
			requestAnimationFrame(frame);
		}

		requestAnimationFrame(frame);

		// // 간단한 렌더링 커맨드 작성 (여기서는 그냥 캔버스 클리어)
		// const commandEncoder = device.createCommandEncoder();
		// const textureView = context.getCurrentTexture().createView();
		// const renderPassDescriptor: GPURenderPassDescriptor = {
		// 	colorAttachments: [{
		// 		view: textureView,
		// 		clearValue: { r: 1.0, g: 0.6, b: 0.9, a: 1.0 },
		// 		loadOp: 'clear',
		// 		storeOp: 'store',
		// 	}],
		// };

		// const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
		// passEncoder.end();

		// device.queue.submit([commandEncoder.finish()]);

		// console.log('WebGPU 렌더링 완료');

	}

	async onClose() {
		// Nothing to clean up.
	}
}

async function testWebGPU() {
	// const adapter = await (navigator as any).gpu.requestAdapter();
	// const device = await adapter?.requestDevice();

	// // console.log("Electron version:", process.versions.electron);
	// // console.log("Chromium version:", process.versions.chrome);
	// console.log("WebGPU Adapter:", adapter);
	// console.log("WebGPU Device:", device);

	// const canvas = document.createElement('canvas');
	// canvas.width = 640;
	// canvas.height = 480;
	// // document.body.appendChild(canvas);
	// container.appendChild(canvas);

	// const context = canvas.getContext('webgpu') as GPUCanvasContext;
	// const format = (navigator as any).gpu.getPreferredCanvasFormat();

	// context.configure({
	// 	device: device,
	// 	format: format,
	// 	alphaMode: 'opaque',
	// });

	// // 간단한 렌더링 커맨드 작성 (여기서는 그냥 캔버스 클리어)
	// const commandEncoder = device.createCommandEncoder();
	// const textureView = context.getCurrentTexture().createView();
	// const renderPassDescriptor: GPURenderPassDescriptor = {
	// 	colorAttachments: [{
	// 		view: textureView,
	// 		clearValue: { r: 0.3, g: 0.6, b: 0.9, a: 1.0 },
	// 		loadOp: 'clear',
	// 		storeOp: 'store',
	// 	}],
	// };

	// const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
	// passEncoder.end();

	// device.queue.submit([commandEncoder.finish()]);

	// console.log('WebGPU 렌더링 완료');
}


export default class Astra extends Plugin {
	settings: AstraSettings;

	async onload() {
		console.log('loading plugin');

		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_EXAMPLE,
			(leaf) => new ExampleView(leaf)
		);

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
			this.activateView();
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		testWebGPU();

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
		console.log('unloading plugin');
	}

	async activateView() {
		const { workspace } = this.app;
		// const leaf = this.app.workspace.getLeaf(isLocalGraph ? "split" : false);
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it

			leaf = this.app.workspace.getLeaf(false);
			await leaf.setViewState({ type: VIEW_TYPE_EXAMPLE, active: true });
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		workspace.revealLeaf(leaf);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: Astra;

	constructor(app: App, plugin: Astra) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
