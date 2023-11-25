class BroadcastWindowManager 
{
	#broadcastChannel;

	#windows;
	#id;
	#winData;
	#winShapeChangeCallback;
	#winChangeCallback;
	
	constructor ()
	{
		let that = this;

		this.#windows = new Map();
		this.#broadcastChannel = new BroadcastChannel('myChannel');

		this.#broadcastChannel.onmessage = (event) => {
			const message = event.data;
			let changed;
			
			switch (message.type) {
			case 'add':
				changed = !that.#windows.has(message.windowId);
				that.#windows.set(message.windowId, message.winData);
				if (changed && that.#winChangeCallback) that.#winChangeCallback();
				that.#broadcastChannel.postMessage({ type: 'update', windowId: this.#id, winData: this.#winData });
				break;
			case 'remove':
				changed = that.#windows.delete(message.windowId);
				if (changed && that.#winChangeCallback) that.#winChangeCallback();
				break;
			case 'update':
				changed = !that.#windows.has(message.windowId);
				that.#windows.set(message.windowId, message.winData);
				if (changed && that.#winChangeCallback) that.#winChangeCallback();
				break;
			default:
				break;
			}
		};
		window.addEventListener('beforeunload', function (e) {
			that.#broadcastChannel.postMessage({ type: 'remove', windowId: that.#id });
		});
	}

	// initiate current window (add metadata for custom data to store with each window instance)
	init (metaData)
	{
		this.#id = Date.now();
		let shape = this.getWinShape();
		this.#winData = {id: this.#id, shape: shape, metaData: metaData};
		this.#windows.set(this.#id, this.#winData);

		this.#broadcastChannel.postMessage({ type: 'add', windowId: this.#id, winData: this.#winData });
	}

	getWinShape ()
	{
		let shape = {x: window.screenLeft, y: window.screenTop, w: window.innerWidth, h: window.innerHeight};
		return shape;
	}

	update ()
	{
		//console.log(step);
		let winShape = this.getWinShape();

		if (winShape.x != this.#winData.shape.x ||
			winShape.y != this.#winData.shape.y ||
			winShape.w != this.#winData.shape.w ||
			winShape.h != this.#winData.shape.h)
		{
			
			this.#winData.shape = winShape;
			this.#broadcastChannel.postMessage({ type: 'update', windowId: this.#id, winData: this.#winData });

			if (this.#winShapeChangeCallback) this.#winShapeChangeCallback();
		}
	}

	setWinShapeChangeCallback (callback)
	{
		this.#winShapeChangeCallback = callback;
	}

	setWinChangeCallback (callback)
	{
		this.#winChangeCallback = callback;
	}

	getWindows ()
	{
		return Array.from(this.#windows.entries())
			.sort(([keyA], [keyB]) => {
				// Compare keys for sorting
				if (keyA < keyB) return -1;
				if (keyA > keyB) return 1;
				return 0;
			})
			.map(([key, value]) => value);
	}

	getThisWindowData ()
	{
		return this.#winData;
	}

	getThisWindowID ()
	{
		return this.#id;
	}
}

export default BroadcastWindowManager;