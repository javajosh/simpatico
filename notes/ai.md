# Artificial Intelligence

ChatGPT is very cool, as is Github Copilot.

One thing I'd like to do is get a model working locally.
One lead is [this guy](https://www.youtube.com/watch?v=kCc8FmEb1nY). It's a long video (I'm still working through it) but he goes into the nuts and bolts of making ChatGPT from its constituent parts. It feels fluent to a non-python expert, although he does come in at a fairly high level - assuming knowledge of specific libraries, datasets, algorithms and datastructures.

## Fun applications

[Using ChatGPT as a DM](https://obie.medium.com/my-kids-and-i-just-played-d-d-with-chatgpt4-as-the-dm-43258e72b2c6) I would have liked to see the non-combat areas stressed.

## 2/26/24 Meetup about Tensorflow.js
Jason Mayes, [@jason_mayes](https://twitter.com/jason_mayes) Web AI Lead at Google
[Linked In](https://linkedin.com/in/WebAI).
tag projects with #WebAI #WebML
via [Jax AI Meetup](https://www.meetup.com/jax-ai/events/298932620)

## Initial code
Note: this will only run in Chrome 113+ because it requires WebGPU support.

```bash
npm install @tensorflow/tfjs @tensorflow/tfjs-backend-webgpu esm
```
```html
<script src="/node_modules/@tensorflow/tfjs/dist/tf.min.js"></script>
<script src="/node_modules/@tensorflow/tfjs-backend-webgpu/dist/tf-backend-webgpu.min.js"></script>
```
```js
// todo figure out how to import like this
// import * as tf from '/node_modules/@tensorflow/tfjs-backend-webgpu/dist/tf-backend-webgpu.min.js';
// import * as tf from '/node_modules/@tensorflow/tfjs/dist/tf.min.js';

const init = async () => {
  await tf.ready();

  // Define the values for tensors a and b
  const a = tf.tensor([[1, 2], [3, 4]]);
  const b = tf.tensor([[5, 6], [7, 8]]);
  tf.matMul(a, b).print();
};

init();

```
```js
/// DO NOT EXECUTE, will crash your browser
/**
 * How much GPU Ram is available?
 *
 * Note: always fails with "Error retrieving GPU RAM: Error: Device properties not available"
 * @returns {Promise<number>}
 */
async function getGPUMemoryInfo() {
  const gpu = navigator.gpu;
  if (!gpu) {
    console.error('WebGPU is not supported in this browser.');
    return;
  }

  const adapter = await gpu.requestAdapter();
  if (!adapter) {
    console.error('No GPU adapter found.');
    return;
  }

  const device = await adapter.requestDevice();
  const memoryInfo = device.properties.deviceMemorySize;

  console.log('GPU Memory Size: ' + memoryInfo + ' bytes');
}

/**
 * Try to ramp up buffer allocation in 2GB increments until it fails.
 * This one will crash your browser.
 * @returns {Promise<number>}
 */
async function getMaxGPUMemorySize2() {
  const gpu = navigator.gpu;
  if (!gpu) {
    console.error('WebGPU is not supported in this browser.');
    return;
  }

  const adapter = await gpu.requestAdapter();
  if (!adapter) {
    console.error('No GPU adapter found.');
    return;
  }

  const device = await adapter.requestDevice();

  let bufferSize = 2048; // Initial buffer size
  let maxBufferSize = bufferSize;

  try {
    while (true) {
      const buffer = device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.STORAGE
      });
      buffer.destroy();
      maxBufferSize = bufferSize;
      bufferSize += 2048; // Double the buffer size for the next iteration
    }
  } catch (error) {
    console.log('Maximum GPU Memory Size: ' + maxBufferSize + ' bytes');
    return maxBufferSize;
  }
}

```

If things go wrong, it's useful to check your versions
```bash
#!/bin/bash

# Get Windows Version
windowsVersion=$(lsb_release -ds)

# Get Chrome Version via Registry
chromeVersion=$(reg query 'HKLM\SOFTWARE\Wow6432Node\Google\Chrome\BLBeacon' /v version | grep version | awk '{print $NF}')

# Get GPU Information
gpuInfo=$(lspci | grep -i vga)

echo "Windows Version: $windowsVersion"
echo "Chrome Version: $chromeVersion"
echo "GPU Info: $gpuInfo"

```

### Links
- Tensorflow low-code [Visual Blocks](https://visualblocks.withgoogle.com/#/demo)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [cdn.jsdelivr.net/npm/@tensorflow/tfjs](https://cdn.jsdelivr.net/npm/@tensorflow/tfjs)
- [@tensorflow-models/qna](https://github.com/tensorflow/tfjs-models/tree/master/qna)
- [TensorFlow](https://www.tensorflow.org/)
    - Facemesh model
    - Depth information
    - [Face Modeling Demo](https://storage.googleapis.com/tfjs-models/demos/face-landmarks-detection/index.html?model=mediapipe_face_mesh)
    - [Hand Gesture Code](https://github.com/tensorflow/tfjs-models/tree/master/hand-pose-detection)
    - Full body segmentation
    - Selfie segmentation
    - speech-to-text with [whisper web turbo](https://github.com/FL33TW00D/whisper-turbo?tab=readme-ov-file)
    - see also a [huge gallery of tfjs demos](https://github.com/tensorflow/tfjs/blob/master/GALLERY.md)
- Learning
  - Jason's course: [goo.gle/Learn-WebML](https://goo.gle/Learn-WebML)
  - [2 minute papers](https://www.youtube.com/@TwoMinutePapers)
  - [learning tenserflow book oreilley](https://www.oreilly.com/library/view/learning-tensorflowjs/9781492090786/)
  - [deep learning in js manning](https://www.manning.com/books/deep-learning-with-javascript)
 - Code assist?
  [mlc.ai mlc llm browser coding assistant](https://mlc.ai/) also a [youtube channel](https://www.youtube.com/@mlc-ai2867)
   - possibly impressive in-browser demo of chat with various models, including Llama 7b and Gemma from Google https://webllm.mlc.ai/. However it didn't load and run for me in Chrome 122 on Windows 10 with an nvidia 8G GPU.
