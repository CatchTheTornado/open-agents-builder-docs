# Open Agents Builder Documentation

Welcome to the Open Agents Builder documentation repository. This repository contains comprehensive guides and API documentation to help you understand and utilize the Open Agents Builder platform effectively.

## Table of Contents

- [Introduction](#introduction)
- [Guides](#guides)
    - [Creating Your First Agent](#creating-your-first-agent)
    - [Custom Entities and API Endpoints](#custom-entities-and-api-endpoints)
    - [New Tool Integration](#new-tool-integration)
- [API Documentation](#api-documentation)
    - [Agent Management API](#agent-management-api)
    - [Attachments Management API](#attachments-management-api)
    - [Order Management API](#order-management-api)
    - [Product Management API](#product-management-api)
    - [Audit Log API](#audit-log-api)
    - [Stats API](#stats-api)
    - [Executing Flow via API](#executing-flow-via-api)
- [Extensibility](#extensibility)
    - [Adding New Entity and API Endpoint](#adding-new-entity-and-api-endpoint)
    - [Adding New Tool Integration](#adding-new-tool-integration)
- [Contributing](#contributing)
- [License](#license)

## Introduction

Open Agents Builder is a platform designed to help you create, manage, and deploy intelligent agents. This documentation provides all the necessary information to get started and make the most out of the platform.

## Guides

### Creating Your First Agent

Learn how to create your first agent using the Open Agents Builder platform. This guide will walk you through the process step-by-step. [Read more](src/content/docs/guides/4-creating-first-agent.md)

### Custom Entities and API Endpoints

This guide explains how to add new entities and API endpoints to manage them within your Next.js + Drizzle + TypeScript setup. [Read more](src/content/docs/extensibility/0-new-endpoint-entity.md)

### New Tool Integration

A step-by-step guide on how to extend Open Agents Builder by adding new custom AI tools. [Read more](src/content/docs/extensibility//20-new-tool-integration.md)

## API Documentation

### Agent Management API

Comprehensive REST API documentation for managing agents, including creating, updating, and deleting agents. [Read more](/src/content/docs/api/10-agent-api.md)

### Attachments Management API

Detailed documentation on how to manage attachments, including creating, updating, and retrieving binary files. [Read more](/src/content/docs/api/16-attachments-api.md)

### Order Management API

REST API documentation for managing orders in your e-commerce schema, including creating, updating, and deleting orders. [Read more](/src/content/docs/api/13-order-api.md)

### Product Management API

Documentation for managing products through the API, including creating, updating, and deleting products. [Read more](/src/content/docs/api/14-products-api.md)

### Audit Log API

API documentation for managing audit logs, including creating and retrieving logs. [Read more](/src/content/docs/api/17-audit-log-api.md)

### Stats API

Documentation for tracking usage metrics such as prompt/completion tokens and aggregated monthly stats. [Read more](/src/content/docs/api/18-stats-api.md)

### Executing Flow via API

A guide on how to execute a Flow-type agent via the API, including details of the FlowChunkType and FlowChunkEvent interfaces. [Read more](/src/content/docs/api/20-executing-flow.md)

## Extensibility

### Adding New Entity and API Endpoint

Learn how to add new entities and API endpoints to manage them within your application. [Read more](/src/content/docs/extensibility/0-new-endpoint-entity.md)

### Adding New Tool Integration

A guide on how to add new custom AI tools to let the AI integrate with third-party systems. [Read more](/src/content/docs/extensibility/20-new-tool-integration.md)

## Contributing

We welcome contributions to improve the documentation and the platform!

## License

This project is licensed under the MIT License.
