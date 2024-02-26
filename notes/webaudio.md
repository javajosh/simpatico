# Webaudio Browser sound test
2019

A very simple exploration of the [webaudio api](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API).

```html
<button id="beeper">beep()</button>
```

```js

  document.getElementById('beeper').onclick=beep;

  let ctx;
  function beep(){
    const beepSpec = {
      freq1: 5000, freq2: 2000,
      dur: .5, //s
      vol: .1, //normalized?
      shape: 'sine', //OscillatorNode.type "sine", "square", "sawtooth", "triangle" and "custom"  note: 'custom' is a PeriodicWave
    };
    // we do this because the audio context goes away sometimes.
    ctx = ctx ? ctx : new AudioContext();
    const osc = ctx.createOscillator();
    const gainOsc = ctx.createGain();
    const vol = beepSpec.vol || 1;

    osc.type = beepSpec.shape;
    osc.frequency.setValueAtTime(beepSpec.freq1, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(beepSpec.freq2, ctx.currentTime + beepSpec.dur / 2);
    osc.frequency.exponentialRampToValueAtTime(beepSpec.freq1, ctx.currentTime + beepSpec.dur);

    gainOsc.gain.setValueAtTime(vol, ctx.currentTime);
    gainOsc.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + beepSpec.dur);

    osc.connect(gainOsc);
    gainOsc.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + beepSpec.dur);
  }
```
