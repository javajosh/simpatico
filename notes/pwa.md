# Progressive Web Apps (PWA)

This seems to be a google only initiative (supported only in Chrome or Edge).
It involves a [manifest.json file and a service worker](https://web.dev/add-manifest/) ([mdn link](https://developer.mozilla.org/en-US/docs/Web/Manifest))
that you add to your page `<link rel="manifest" href="/manifest.json">`.
Testing is done in the manifest pain of chrome dev tools.
You can add icons, splash screens and screen-shots.
It's basically a way to make your web app look like a native app, and be carried on app stores.
It also provides an ["install" button](https://web.dev/promote-install/) in the browser that will add the app to your desktop or home screen.
I've never installed one to my knowledge.

You can't install them on Android, but they have [special support from apps in a Trusted Web Activity (TWA)](https://web.dev/using-a-pwa-in-your-android-app/). Interesting contrast between PWA and old school Android WebView and Cordova. (It would also be interesting to contrast with Flutter and React Native.)




