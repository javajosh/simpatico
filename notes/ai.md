# Artificial Intelligence

ChatGPT is very cool, as is Github Copilot.

One thing I'd like to do is get a model working locally.
One lead is [this guy](https://www.youtube.com/watch?v=kCc8FmEb1nY). It's a long video (I'm still working through it) but he goes into the nuts and bolts of making ChatGPT from its constituent parts. It feels fluent to a non-python expert, although he does come in at a fairly high level - assuming knowledge of specific libraries, datasets, algorithms and datastructures.

## Fun applications

[Using ChatGPT as a DM](https://obie.medium.com/my-kids-and-i-just-played-d-d-with-chatgpt4-as-the-dm-43258e72b2c6) I would have liked to see the non-combat areas stressed.

## 2/26/24 Meetup about Tensorflow.js
Jason Mayes, [@jason_mayes](https://twitter.com/jason_mayes) Web AI Lead at Google
[Linked In](linkedin.com/in/WebAI).
tag projects with #WebAI #WebML
via [Jax AI Meetup](https://www.meetup.com/jax-ai/events/298932620)

## Initial code
```bash
npm install @tensorflow/tfjs @tensorflow/tfjs-backend-webgpu esm
```
```html
<script src="/node_modules/@tensorflow/tfjs/dist/tf.min.js"></script>
<script src="/node_modules/@tensorflow/tfjs-backend-webgpu/dist/tf-backend-webgpu.min.js"></script>
```
```js
// This didn't work somehow
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

### Links
- Tensorflow low-code [Visual Blocks](https://visualblocks.withgoogle.com/#/demo)
- [TensorFlow.js](https://www.tensorflow.org/js)
- [goo.gle/made-with-tfs](https://goo.gle/made-with-tfs)
- [cdn.jsdelivr.net/npm/@tensorflow/tfjs](https://cdn.jsdelivr.net/npm/@tensorflow/tfjs)
- [@tensorflow-models/qna](https://github.com/tensorflow/tfjs-models/tree/main/qna)
- [TensorFlow](https://www.tensorflow.org/)
- Facemesh model
- Depth information
- [goo.gle/3Jf8k9z - Face Modeling](https://goo.gle/3Jf8k9z)
- [goo.gle/36r5YWq - Hand Gesture](https://goo.gle/36r5YWq)
- Full body segmentation
- Selfie segmentation
- [goo.gle/Learn-WebML](https://goo.gle/Learn-WebML)

whisper web turbo
hugging face hired the maker.
cloud.next - making custom nodes

  [learning tenserflow book oreilley](https://www.oreilly.com/library/view/learning-tensorflowjs/9781492090786/)
  [deep learning in js manning](https://www.manning.com/books/deep-learning-with-javascript)

Where to learn about stuff
[2 minute papers](https://www.youtube.com/@TwoMinutePapers)

[mlc.ai mlc llm browser coding assistant](https://mlc.ai/) also a [youtube channel](https://www.youtube.com/@mlc-ai2867)
