# Redbean

[Redbean](https://redbean.dev/index.html) is an incredible project by a very strong developer, Justine Tunney.
She has built an extremely small, high performance web-server that runs natively on every major platform. It is close to optimal in terms of minimalism, and therefore security, simplicity, and maintainability.

Because entries are zipped, they can be memory mapped and served as-is to requesting clients that support gzip compression.

She has included TLS, Lua and SQLlight, and the binary is about 1MB with no dependencies.
I also think her documentation is wonderful: terse, complete, and without waste. One can learn a great deal just looking at how she demonstrates masterful unix tool usage. Really remarkable!

Compare this with the [reflector](reflector) which is a node program, and so requires all of node, and a few (admittedly small) dependencies. It is 20x the size, slower, and requires a platform specific install step. The trade-off is that reflector is much more accessible to programmers, and there are more libraries available for it. (Redbean is written in C). One serious feature it lacks is support for websockets, which is by nature difficult since this is a forking server. The websocket server would need to live in the persistent root process.

## Application: site mirroring

Let us say we want to mirror a website, either for use locally or to serve it from a different URL, or to replace the server. We can use wget and redbean like so:

```bash
cd redbean
wget                     \
  --mirror               \
  --convert-links        \
  --adjust-extension     \
  --page-requisites      \
  --no-parent            \
  --no-if-modified-since \
  https://www.cityethics.org/
  zip -r cityethics.org.com www.cityethics.org/  # default page for directory
#  printf 'GET http://www.cityethics.org HTTP/1.0\n\n' | nc 127.0.0.1 8080
#  HTTP/1.0 200 OK
#  Link: <http://127.0.0.1/www.cityethics.org/index.html>; rel="canonical"
```
