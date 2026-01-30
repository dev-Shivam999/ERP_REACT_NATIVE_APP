# Remove node_modules and package-lock.json to ensure clean install
rm -rf node_modules package-lock.json

# Install the corrected dependencies
npm install

# Clear Expo cache
npx expo install --fix

# Clean prebuild
npx expo prebuild --clean






eas build --platform android --profile preview
