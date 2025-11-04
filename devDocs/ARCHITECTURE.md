# The Mapping Project Architecture

## Introduction

This document outlines the architecture that we've chosen as well as what is still under discussion.

## Simplicity

One of the major goals of this project is to make it something that newer developers can quickly onboard to and begin making substantive contributions to. As such we are favoring simplicity over advanced functionality.

In practice this looks like:

1. Not Using a Bundler

Vite is pretty sweet but it also means we have a transpilation step.

2. Not Using TypeScript

We need a bundler to use TypeScript, so we are using Vanilla JS at this point.

In addition, TypeScript is powerful but can also be confusing for newer devs.

This doesn't mean we will never use this functionality - over time we will likely adopt both Vite and TypeScript. But here's the key. As we add these more advanced functionality we should write blog posts explaining what we are doing and why. This way new developers onboarding to the project can:

1. Look at the evolution of the code over time. Becoming familiar with the basic concepts underlying the application before needing to tackle advanced concepts.
2. Read about the evolving complexity of the project and understand each layer of complexity individually.

## Decoupled Frontend and Backend

Industry practice tends toward decoupling the frontend and backend. The backend becomes an API that the frontend uses to display a UI.

This seems to me (Dave) like a no brainer but [HTMX](https://htmx.org/) makes me wonder...

To keep things as simple as possible for the moment we don't have a "backend", instead the data is store in `assets/pois.json`. We are using [GeoJSON](https://geojson.org/) for the data as it is a robust standard that is widely utilized.

## Backend Technology

Assuming that we do have a separate backend, what do we want to use to build our backend?

We could go with a JS/TS base in which case we might use:

- [Express](https://expressjs.com/)
- [Fastify](https://fastify.dev/)
- [Next.js](https://nextjs.org/)
  - Dave: This is hefty and ties us to React for the frontend.

Or we could use a Python base:

- [FastAPI](https://fastapi.tiangolo.com/)
- [Django](https://www.djangoproject.com/)
- [AIR](https://feldroy.github.io/air/)
