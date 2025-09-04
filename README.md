
# Group Study App

An open-source mobile app for students to create, join, and manage study groups. Built with React Native, Expo, and a modern design system.

---

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Design System](#design-system)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Authentication:** Sign up and log in securely.
- **Dashboard:** View all groups you have joined or created.
- **Create Group:** Start a new study group with subject, code, and description.
- **Join Group:** Join existing groups using a unique code.
- **Profile:** View and edit your profile, manage settings, and toggle preferences.
- **Settings:** Access app settings and preferences.
- **Modern UI:** Consistent, accessible, and responsive design using a custom color system.

## Screenshots

> _Add screenshots of the main screens here (Dashboard, Create Group Modal, Profile, etc.)_

## Tech Stack

- **React Native** (with [Expo](https://expo.dev))
- **TypeScript**
- **Expo Router** (file-based navigation)
- **@expo/vector-icons** (Feather icons)
- **react-native-safe-area-context** (Safe area handling)
- **Custom Design System** (see `constants/Colors.ts`)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YashBhalodiya/group-study-app.git
   cd group-study-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server:**
   ```bash
   npx expo start
   ```

4. **Run on your device:**
   - Use the QR code in your terminal or browser to open the app in Expo Go (Android/iOS)
   - Or run on an emulator/simulator

### Environment Variables

If you use AWS Amplify or other services, configure your environment in the `amplify/` and `app/awsConfig.ts` files.

## Project Structure

```
group-study-app/
├── app/                  # Main app source (screens, navigation)
│   ├── (tabs)/           # Tab navigation screens (groups, profile, settings, etc.)
│   ├── components/       # Reusable UI components
│   ├── constants/        # Design system (colors, layout)
│   ├── styles/           # Global and shared styles
│   └── ...
├── assets/               # Images, fonts, animations
├── amplify/              # AWS Amplify backend config (if used)
├── package.json          # Project metadata and scripts
├── tsconfig.json         # TypeScript config
└── ...
```

## Design System

All colors and layout values are defined in `app/constants/Colors.ts` and `app/constants/Layout.ts`. Use these for all UI elements to ensure consistency.

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Commit and push (`git commit -m "Add your feature"`)
5. Open a Pull Request

Please follow the existing code style and add tests where appropriate.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
