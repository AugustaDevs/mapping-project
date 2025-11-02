# The Mapping Project Architecture

## Introduction

This document outlines the architecture that we've chosen as well as what is still under discussion.

## Simplicity

Part of the goal for this project is to make it something that newer developers can contribute to. As such we are intentionally keeping the tooling for the project as simple as possible.

As time progresses we expect to implement various tooling (e.g. TypeScript, Vite) but this can occur step-by-step and hopefully be coupled with blog posts that walk newer developers through the thought and actual change process.

When a new developer onboards in a year, ideally, they should be able to go back and see the code from it's beginning and follow along with how it evolved. This is helpful when a developer is building a mental model.

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
