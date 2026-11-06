# Contributing to LockedIn

Want to help improve LockedIn? Here's how:

## Getting Started

1. Fork this repository
2. Create a branch for your feature (`git checkout -b feature/your-feature`)
3. Make your changes
4. Test by loading the extension in Firefox/Edge/Chrome
5. Commit your changes (`git commit -m 'Add your feature'`)
6. Push to your fork (`git push origin feature/your-feature`)
7. Open a Pull Request

## Local Development

```bash
# Clone your fork
git clone https://github.com/KartikHalkunde/LockedIn-YT.git
cd LockedIn-YT

# Make your changes...

# Build
bash scripts/build.sh

# Load in Firefox for testing
# Go to about:debugging#/runtime/this-firefox
# Click "Load Temporary Add-on" and select the ZIP file
```

## Bug Reports & Feature Requests

If something isn't working right or you have an idea for improvement:

- **Bugs**: [Open an issue](https://github.com/KartikHalkunde/LockedIn-YT/issues) with details about what happened and what you expected
- **Features**: Start a [discussion](https://github.com/KartikHalkunde/LockedIn-YT/discussions) to talk about your idea

### When reporting bugs, please include:
- Your browser and version
- Steps to reproduce the issue
- What you expected vs what actually happened
- Screenshots if relevant

## Code Style

- Use vanilla JavaScript (no frameworks)
- Keep code simple and readable
- Add comments for complex logic
- Follow existing code structure
- No minification or obfuscation

## Testing

Run the focused regression tests with Node.js 18 or newer:

```bash
node --test tests/*.test.cjs
```

Before submitting a PR:

1. Test on Firefox
2. Test on Edge/Chrome
3. Verify all toggle switches work
4. Check that settings persist after refresh
5. Ensure no console errors

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
