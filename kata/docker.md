# Simpatico: Docker

Docker defines a reusable starting point for processes such that each process can act like it's the only process on a clean system.
Docker defines the `Dockerfile` which is like a shell script, but it includes more steps, going all the way back to approx "install the OS".

For Simpatico, Docker may be useful for running the [reflector](/reflector.md), simplifying installation and maintenance.
This would be particularly useful to people (or systems) checking out the repo for the first time.
A Dockerfile may be a nice thing to have, a de facto convention that documents how to install and run your software.

But I'm not going to use it.
It's overkill for this project at this stage.

## Dockerfile

The `Dockerfile` is a list of commands that result in an binary image.
A typical devops repository will look like a tree of directories with Dockerfiles in them.
This repository forms a trie of execution steps.

## Docker Modeled with Simpatico
There is a clear correspondence between Simpatico and Docker:
The `Dockerfile` is like the ops array.
The image is like the residue under [combine](combine2.md).
The repo and Docker daemon (which stores images/residues) is like the [stree](/stree2.md).

# Providers
The company Docker Inc. started it all, but it [may not be a viable company](https://computer.rip/2023-03-24-docker.html).
(That's also a good article for exploring alternatives to Docker Hub.)

## Podman
From the [podman website](https://podman.io/)
  > What is Podman?
  > Podman is a daemonless container engine for developing, managing, and running OCI Containers on your Linux System.
  > Containers can either be run as root or in rootless mode. Simply put: alias docker=podman.

[OCI](https://opencontainers.org/) stands for "Open Containers Initiative", which is a rabbit hole.

## Errata
This [lovely article](https://computer.rip/2023-03-24-docker.html) (and in a style I quite like) jb speaks convincingly of the end of docker, and the difficulty presented by The Registry. And I realized that these are all options for "clean starting points" and how ironic that the battle for zero could be so fierce. (and "The Battle For Zero" is a killer blog post title). It seems like there is space for a paid-for Docker registry; at the very least, we could get in the habit of fully specifying the registry of our dependencies. In this way, the internet, DNS _ ICANN and BGP reassert their Zero-ness. And it's hard for a company to do business if you invent a protocol. Unless you provide a service that popularizes the protocol, and hides the service cost, until it becomes popular, and you monetize in the most obvious possible way.

Private registries: https://www.slant.co/topics/2436/~best-docker-image-private-registries

## Mystery

Figure out why containerd is taking up CPU and egress on the linode.
It's only 1% and 1.5kb but still. It should be 0.
