import { createMachine, assign } from 'xstate';
import axios, { CancelTokenSource } from 'axios';

interface UploadContext {
	files: File[];
	progress: number;
	error: Error | null;
	uuid: string | null;
	currentFileIndex: number;
}

type UploadEvent =
	| { type: 'UPLOAD'; files: File[] }
	| { type: 'RETRY' }
	| { type: 'FILE_UPLOAD_COMPLETE' }
	| { type: 'UPLOAD_START' }
	| { type: 'CANCEL' }
	| { type: 'RESET' };

const source: CancelTokenSource = axios.CancelToken.source();

const uploadFile = async (file: any, context: UploadContext): Promise<void> => {
	var res;
	const resUrl = await axios.get("/api/getUrl");
	const url = `${resUrl.data.url}/${resUrl.data.uuid}`;
	const formData = new FormData();
	formData.append('file', file);
	res = await axios.post(url, formData, {
		headers: {
			"Content-Type": "multipart/form-data",
		},
		cancelToken: source.token,
	})
		.then(response => {
			console.log("File uploaded, Count: ", context.currentFileIndex + 1);
		})
		.catch(error => {
			if (axios.isCancel(error)) {
				console.log('Request cancelled:', error.message);
			} else {
				console.log('Error:', error.message);
			}
			throw new Error('Server responded with an error');
		});
	console.log(res, "result");
	return res;
};

export const uploadMachine = createMachine<UploadContext, UploadEvent>({
	id: 'upload',
	initial: 'idle',
	context: {
		files: [],
		progress: 0,
		error: null,
		uuid: null,
		currentFileIndex: -1,
	},
	states: {
		idle: {
			on: {
				UPLOAD: {
					target: "uploadingFile",
					actions: ['assignFiles', "assignCurrentFileIndex"]
				}
			}
		},
		uploading: {
			always: [
				{
					target: 'completed',
					cond: (context) => context.currentFileIndex === context.files.length - 1,
				},
				{
					target: 'uploadingFile',
					actions: ['incrementCurrentFileIndex', 'incrementProgress'],
				}
			]
		},
		uploadingFile: {
			invoke: {
				src: 'uploadFile',
				onDone: {
					target: 'uploading',
				},
				onError: {
					target: 'failed',
					actions: ['assignError'],
				},
			},
			on: {
				CANCEL: {
					target: 'cancelled',
					actions: ['cancelUploadRequest'],
				},
			},
		},
		completed: {
			data: {
				progress: 100,
			},
			on: {
				RESET: {
					target: 'idle',
					actions: ['resetContext'],
				},
			},
		},
		failed: {
			on: {
				RETRY: {
					target: 'uploading',
					actions: ['retryUpload'],
				},
			},
		},
		cancelled: {
			data: {
				progress: 0,
			},
			on: {
				RESET: {
					target: 'idle',
					actions: ['resetContext'],
				},
			},
		}
	},
}, {
	actions: {
		assignFiles: assign((context, event: any) => ({
			...context,
			files: event.files,
		})),
		assignUuid: assign((context, event: any) => ({
			...context,
			uuid: event.data.uuid,
		})),
		assignError: assign((context, event: any) => ({
			...context,
			error: event.data.error,
		})),
		retryUpload: assign((context, _) => ({
			...context,
			progress: 0,
			error: null,
			currentFileIndex: -1,
		})),
		cancelUploadRequest: (context, _) => {
			setTimeout(() => {
				source.cancel('Request cancelled');
			}, 10);
		},
		assignCurrentFileIndex: assign((context, _) => ({
			...context,
			currentFileIndex: 0,
		})),
		incrementCurrentFileIndex: assign((context: any, _) => ({
			...context,
			currentFileIndex: context.currentFileIndex + 1,
		})),
		incrementProgress: assign((context: any, _) => ({
			...context,
			progress: 100 * (context.currentFileIndex + 1) / context.files.length,
		})),
		resetContext: assign((context: any, _) => ({
			...context,
			files: [],
			progress: 0,
			error: null,
			uuid: null,
			currentFileIndex: -1,
		}))
	},
	services: {
		getUploadUrl: async (context) => {
			const response = await axios.get('/api/uuid');
			return response.data;
		},
		uploadFile: async (context: any) => {
			const { files, currentFileIndex } = context;
			const file = files[currentFileIndex];
			await uploadFile(file, context)
				.then(results => {
					console.log(`File ${currentFileIndex + 1} uploaded successfully`);
					return results;
				})
				.catch(error => {
					throw new Error(`Error uploading file ${currentFileIndex + 1}: ${error}`)
				});
			return;
		},
	},
});
