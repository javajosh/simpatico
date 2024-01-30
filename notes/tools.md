# Building and running things from source
It's finicky and often takes some trial and error.
I propose to formalize an idea that @jart expresses in her redbean documention: the version vector.
We would have a `tools.json` in analogy to `package.json` that describes the tooling that the primary developer uses to build the software. For example:

```json
{
  "node":  "20.8.1"
}
```
We may even get a little fancy and say:

```json
{ "nvm" :
  {
    "version" : "0.39.1",
    "node":  "20.8.1"
  }
}
```
For Java this may look like:
```json
{
  "sdkman": {
    "version" : "5.18.2",
    "java": "17",
    "gradle": "7.2"
  }
}
```
Of course you may also need a database, or redis or make or...
It may also be useful to include operating system version details, depending on the toolchain.

# The Script
The benefit here is that we can write a script that can generate this file.
If it is shipped alongside `tools.json` then a dev can simply run it and discover which versions are wrong.
It can sometimes be tricky to figure out which versions you have because each tool has a different command, and outputs in a different format.
The script would normalize across many tools, and make it easier to gather this information for bug reports.
Given that this script is supposed to be used without any installed tools, it would be most appropriately expressed as a bash script.
Ideally it would be modular and define a bash function per supported tool, such that they can be easily added.

# Prior art
his data is often buried in a `readme`, or in a `Dockerfile`.
There is often limited support for this within build files, such as `package.json` or `build.groovy`.
The great benefit of the Dockerfile over tools.json is that you see specific invocations of installers which you can copy and adapt for your own purposes.
This advantage would be mitigated by either adding json properties like "install" and/or the inclusion of `tools.md`. This would have the additional benefit of giving tool-oriented bug reports a place to accumulate that wisdom.

