# The Mapping Project Architecture

## Introduction

One of the topics we'll discuss at our first meeting on October 7th will be what architecture we want to use for the project. We have some ideas but we want to open it up for discussion. Below are some initial thoughts, ponder them and come with your own ideas!

## Decoupled Frontend and Backend

Industry practice tends toward decoupling the frontend and backend. The backend becomes an API that the frontend uses to display a UI.

This seems to me (Dave) like a no brainer but [HTMX](https://htmx.org/) makes me wonder...

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