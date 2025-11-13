# Contributing to LAPA Core

Thank you for your interest in contributing to LAPA Core! We welcome contributions from the community and are excited to collaborate with you.

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## How Can I Contribute?

### Reporting Bugs

Before submitting a bug report, please check if the issue has already been reported. If not, create a new issue with the following information:

- A clear and descriptive title
- A detailed description of the problem
- Steps to reproduce the issue
- Expected behavior vs. actual behavior
- Screenshots or animated GIFs if applicable
- Your environment (OS, Node.js version, etc.)

### Suggesting Enhancements

Feature requests are welcome! Please create an issue with:

- A clear and descriptive title
- A detailed explanation of the proposed feature
- The motivation for the feature
- How the feature would be used

### Pull Requests

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Write your code
4. Add or update tests as necessary
5. Ensure all tests pass
6. Ensure LPSP summaries are generated for your changes
7. Update documentation if needed
8. Submit a pull request with a clear description

## Development Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Run tests with `npm test`
4. Make your changes
5. Ensure tests still pass
6. Commit your changes

## Style Guides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

### TypeScript Style Guide

- Follow the existing code style
- Use TypeScript strict mode
- Write clear, descriptive variable and function names
- Comment complex logic
- Write JSDoc for public APIs
- Use Zod for schema validation in protocols like LPSP

### Documentation Style Guide

- Use Markdown for documentation
- Follow the existing documentation structure
- Use clear, concise language
- Include examples where appropriate
- Update phase summaries via LPSP for changes

## Testing Strategy

All contributions should include appropriate tests:

- Unit tests for core functionality
- Integration tests for major features
- End-to-end tests for user workflows
- LPSP validation for phase-related changes
- Task tree testing for orchestration features

##Run tests with:
###``` bash
###npm test

Code Review Process
All submissions require review. We strive to review pull requests within 3 business days. Maintainers may suggest changes or improvements before merging.
Community
Join our Discord server to connect with other contributors and users.