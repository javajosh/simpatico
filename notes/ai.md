ChatGPT 3.5 is cool, I've read that [4 is even cooler](https://cdn.openai.com/papers/gpt-4.pdf).
Github Copilot is...uneven.

One thing I'd like to do is get a model working locally.
My desktop has a beefy CPU and GPU, I think it could run one of these programs. But how to get it to run?

One lead is [this guy](https://www.youtube.com/watch?v=kCc8FmEb1nY). It's a long video (I'm still working through it) but he goes into the nuts and bolts of making ChatGPT from its constituent parts. It feels fluent to a non-python expert, although he does come in at a fairly high level - assuming knowledge of specific libraries, datasets, algorithms and datastructures.

## Using ChatGPT as a DM

https://obie.medium.com/my-kids-and-i-just-played-d-d-with-chatgpt4-as-the-dm-43258e72b2c6

Although I would have liked to see the non-combat areas stressed.

# 2/26/24 Meetup about Tensorflow.js
Jason Mayes, [@jason_mayes](https://twitter.com/jason_mayes) Web AI Lead at Google
[Linked In](linkedin.com/in/WebAI), tag projects with #WebAI #WebML
via [Jax AI Meetup](https://www.meetup.com/jax-ai/events/298932620)


```js
// import * as tf from '@tensorflow/tfjs-backend-webgpu';

const init = async () => {
    await tf.ready();

    // Now we can create tensors and run ops.
    tf.matMul(a, b).print();
};

init();
```

Tensorflow low-code [Visual Blocks](https://visualblocks.withgoogle.com/#/demo)

tensorflow.js
goo.gle/made-with-tfs
cdn.jsdelivr.net/npm/@tensorflow/tfjs
@tensorflow-models/qna
tensorflow
facemesh model
depth information
goo.gle/3Jf8k9z - face modeling
goo.gle/36r5YWq - hand gesture
full body segmentation
selfie segmentation
goo.gle/Learn-WebML

whisper web turbo
hugging face hired the maker.
cloud.next - making custom nodes

learning tenserflow book oreilley
deep learning in js manning

"make things with impact" to get into google.
2 minute papers
blogs that are well-known
mlc.ai mlc llm browser
