// eslint-disable-next-line
// @ts-ignore
import { useCallback, useState } from 'react';
import { Stage, Container, Sprite } from '@pixi/react';
import { Texture } from 'pixi.js';
import tableSmall from './assets/table2.png';
import table3 from './assets/table3.png';
import table4 from './assets/table4.png';
import seat from './assets/seat-v4.png';
import ErrorBoundary from './ErrorBoundary';
import DraggableBox from './DraggableBox';
import { useKeyboard } from './hooks/useKeyboard';
import { useCopy } from './hooks/useCopy';
import { useWheel } from './hooks/useWheel';

const idToTextureMap = {
	table: tableSmall,
	table3: table3,
	table4: table4,
	seat: seat,
};

const saveStateToJson = (objects) => {
	return JSON.stringify(objects, null, 2);
};

const loadStateFromJson = (jsonString) => {
	const state = JSON.parse(jsonString);
	return state;
};

const defaultObjects = [
	{
		id: '1',
		position: { x: 100, y: 100 },
		rotation: 0,
		scale: { x: 1, y: 1 },
		textureSrc: table4,
		zIndex: 10,
	},
	{
		id: '2',
		position: { x: 200, y: 100 },
		rotation: 0,
		scale: { x: 1, y: 1 },
		textureSrc: seat,
		zIndex: 10,
	},
];

const Editor = () => {
	const [objects, setObjects] = useState(defaultObjects);
	const [selectedItems, setSelectedItems] = useState({});
	const [isEditMode, setIsEditMode] = useState(true);

	const { handleCopy, handlePaste } = useCopy(selectedItems, onPaste);

	useKeyboard(isEditMode, handleKeyDown);
	useWheel(isEditMode, handleResize);
	// const [refObjects, setRefObjects] = useState([]);
	const [savedState, setSavedState] = useState('');

	function onPaste(parsedData) {
		setObjects((prevObjects) => {
			return [
				...prevObjects,
				...Object.keys(parsedData).map((id) => ({
					...prevObjects.filter((obj) => obj.id === id)[0],
					id: id + Math.random(),
				})),
			];
		});
	}

	function handleKeyDown(event) {
		if (event.key === 'Delete') {
			const updatetObjects = objects.filter((obj) => !selectedItems[obj.id]);
			setObjects(updatetObjects);
		}

		if (event.key === 'r' || event.key === 'R') {
			const updatedObjects = objects.map((obj) => {
				if (!selectedItems[obj.id]) {
					return obj;
				}

				const prevRotation = obj.rotation ?? 0;
				const updatedRotation = prevRotation + Math.PI / 2;

				return { ...obj, rotation: updatedRotation };
			});

			setObjects(updatedObjects);
		}

		if (event.ctrlKey && event.key === 'c') {
			handleCopy();
		} else if (event.ctrlKey && event.key === 'v') {
			handlePaste();
		}
	}

	function handleResize(event: WheelEvent) {
		event.stopPropagation();
		if (Object.keys(selectedItems).length !== 0) {
			const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1; // Scale factor based on mouse wheel direction

			const updatedObjects = objects.map((obj) => {
				if (!selectedItems[obj.id]) {
					return obj;
				}

				const prevScale = obj.scale ?? 0;
				const updatedScale = {
					x: prevScale.x * scaleFactor,
					y: prevScale.y * scaleFactor,
				};

				return { ...obj, scale: updatedScale };
			});

			setObjects(updatedObjects);
		}
	}

	const onSaveState = useCallback(() => {
		const savedState = saveStateToJson(objects);
		setSavedState(savedState);
	}, [objects]);

	const onLoadState = useCallback(() => {
		setObjects([]);
		setTimeout(() => {
			const loadedObjects = loadStateFromJson(savedState);
			setObjects(loadedObjects);
		}, 100);
	}, [savedState]);

	const boxes = objects.map(({ id, position, scale, rotation, textureSrc, zIndex }) => {
		debugger;
		function handleTap(e) {
			const updateSelected = { ...selectedItems };
			if (updateSelected[id]) {
				delete updateSelected[id];
			} else {
				updateSelected[id] = id;
			}
			setSelectedItems(updateSelected);
		}

		return (
			<DraggableBox
				key={id}
				texture={Texture.from(textureSrc)}
				position={position}
				rotation={rotation}
				scale={scale}
				cursor="pointer"
				pointertap={handleTap}
				isEditMode={isEditMode}
				zIndex={zIndex}
				tint={selectedItems[id] ? '#F43F5E' : 0xffffff}
			/>
		);
	});

	const onAddObject = useCallback((type) => {
		setObjects((prevObjects) => [
			...prevObjects,
			{
				id: (prevObjects.length + 1).toString(),
				position: { x: 100, y: 100 },
				textureSrc: idToTextureMap[type],
				rotation: 0,
				scale: { x: 1, y: 1 },
				zIndex: 10,
			},
		]);
	}, []);

	console.log('rerender of editor');

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				gap: 20,
				width: '100%',
				height: '100vh', // Ensure the component fills the viewport height
			}}
		>
			<div>
				<button onClick={onSaveState}>Save State</button>
				<button onClick={onLoadState}>Load State</button>
				<button onClick={() => setIsEditMode((prev) => !prev)}>Edit mode</button>
				<p>Edit mode: {isEditMode ? 'on' : 'off'}</p>
			</div>
			<div
				style={{
					display: 'flex',
					gap: 20,
					width: '100%',
				}}
			>
				<Stage
					options={{ backgroundColor: 0xffffff }}
					raf={false}
					onContextMenu={(e) => e.preventDefault()}
					onPointerDown={(e) => e.preventDefault()}
					renderOnComponentChange={true}
					width={1100}
					height={780}
					style={{ border: '1px dashed black' }}
				>
					<Container sortableChildren={true} width={1100} height={780}>
						{boxes}
					</Container>
				</Stage>

				<div>
					{/* <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
						<img src={tableSmall} width={120} height={120} />
						<button onClick={() => onAddObject('table')}>Add table</button>
					</div> */}
					<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
						<img src={table4} width={120} height={220} />
						<button onClick={() => onAddObject('table4')}>Add table</button>
					</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
						<img src={seat} width={120} height={120} />
						<button onClick={() => onAddObject('seat')}>Add seat</button>
					</div>
				</div>
			</div>
			<pre style={{ maxHeight: '600px', height: '100%' }}>
				{JSON.stringify(objects, null, 2)}
			</pre>
		</div>
	);
};

const EditorWithErrorBoundary = () => (
	<ErrorBoundary>
		<Editor />
	</ErrorBoundary>
);

export default EditorWithErrorBoundary;
