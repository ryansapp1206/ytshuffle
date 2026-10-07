// Replaces Google's sign-in script so tests never touch real OAuth.
// requestAccessToken() immediately calls the app's callback with a fake token.
const GSI_STUB = `
window.google = {
    accounts: {
        oauth2: {
            initTokenClient: (config) => ({
                requestAccessToken: () => config.callback({
                    access_token: 'fake-token',
                    expires_in: 3600
                })
            })
        }
    }
};
`;

async function mockGoogleSignIn(page) {
    await page.route('https://accounts.google.com/gsi/client', route =>
        route.fulfill({ contentType: 'application/javascript', body: GSI_STUB })
    );
}

// Records window.open calls instead of opening real tabs.
async function captureOpenedTabs(page) {
    await page.addInitScript(() => {
        window.__opened = [];
        window.open = (url) => { window.__opened.push(url); return null; };
    });
}

module.exports = { mockGoogleSignIn, captureOpenedTabs };
