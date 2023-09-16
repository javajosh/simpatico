# Simpatico: Async Kata()
2023

See:
[home](/),
[litmd](/lit.md),
[audience](/audience.md)

<div class="makeItStop"></div>

JavaScript is single-threaded, which means asynchrony is left as an exercise for the reader.
    1. First there were callbacks.
    2. Then there were `Promises`.
    3. Then there was `async/await`, which is syntax sugar over `Promises`.
    4. There is also `RxJs`, which reifies a program in builder syntax.

In simple cases callbacks are still appropriate, and desirable for their simplicity.
However it can be a challenge to understand what is happening at runtime in systems written this way.
In all cases we are "cutting" the current thread of execution and saying, "This is going to take time, so come back here"

