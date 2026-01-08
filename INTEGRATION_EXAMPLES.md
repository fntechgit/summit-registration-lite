# Summit Registration Lite - Integration Examples

This library provides multiple ways to integrate event registration into your site.

## 📦 Available Components

### `RegistrationButton` - Complete Drop-in Solution ⭐ **EASIEST**
Button + Modal + Form all-in-one. Perfect for quick integration.

### `RegistrationForm` - Form Only
Just the registration form, no button or modal. Use for dedicated pages.

### `RegistrationModal` - Modal Wrapper
Generic modal wrapper. Combine with RegistrationForm for custom implementations.

### `RegistrationLiteWidget` - Legacy (Still Supported)
The original widget. Use new components for better DX.

---

## 🚀 Integration Examples

### Level 1: Drop-in Button (Easiest)

**Perfect for:** Marketing pages, landing pages, any site

```jsx
import { RegistrationButton } from 'summit-registration-lite';
import 'summit-registration-lite/dist/index.css';

function App() {
  return (
    <RegistrationButton
      // Required
      apiBaseUrl="https://api.summit.com"
      clientId="your-client-id"
      getAccessToken={() => 'your-token'}
      summitData={summitData}

      // Button config
      buttonText="Buy Tickets Now"
      buttonClassName="my-custom-button"
      iconClassName="fa fa-ticket"

      // Callbacks - library doesn't navigate, you decide!
      onComplete={(order) => {
        console.log('Registration complete!', order);
        // Redirect, show message, etc.
        window.location.href = '/thank-you';
      }}
      onCancel={() => {
        console.log('User cancelled');
      }}
    />
  );
}
```

---

### Level 2: Full Page Registration

**Perfect for:** Dedicated registration pages

```jsx
import { RegistrationForm } from 'summit-registration-lite';
import 'summit-registration-lite/dist/index.css';

function RegistrationPage() {
  return (
    <div className="registration-page">
      <h1>Event Registration</h1>

      <RegistrationForm
        // Required
        apiBaseUrl="https://api.summit.com"
        clientId="your-client-id"
        getAccessToken={() => 'your-token'}
        summitData={summitData}

        // Callbacks
        onComplete={(order) => {
          console.log('Order:', order);
          navigate('/my-tickets');
        }}
        onCancel={() => {
          navigate('/');
        }}
        onCompleteNavigation={() => {
          // Called when user clicks "Go to Event" etc.
          navigate('/event');
        }}
        onExtraQuestionsRequired={(attendeeId) => {
          // Redirect to extra questions page
          navigate(`/extra-questions?attendee=${attendeeId}`);
        }}
      />
    </div>
  );
}
```

---

### Level 3: Custom Modal Implementation

**Perfect for:** Custom UX, specific styling needs

```jsx
import { RegistrationModal, RegistrationForm } from 'summit-registration-lite';
import 'summit-registration-lite/dist/index.css';

function CustomRegistration() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Register for Event
      </button>

      <RegistrationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Purchase Tickets"
        closeOnEscape={true}
        closeOnOverlayClick={false}
      >
        <RegistrationForm
          apiBaseUrl="https://api.summit.com"
          clientId="your-client-id"
          getAccessToken={() => 'your-token'}
          summitData={summitData}
          onComplete={(order) => {
            alert('Thank you for registering!');
            setIsOpen(false);
          }}
        />
      </RegistrationModal>
    </>
  );
}
```

---

### Level 4: WordPress / Non-React Integration

**For non-React sites:**

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://cdn.summit-reg.com/dist/index.css">
</head>
<body>
  <div id="registration-root"></div>

  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://cdn.summit-reg.com/dist/index.js"></script>

  <script>
    const { RegistrationButton } = SummitRegistrationLite;

    ReactDOM.render(
      React.createElement(RegistrationButton, {
        apiBaseUrl: 'https://api.summit.com',
        clientId: 'your-client-id',
        summitData: {...},
        getAccessToken: () => 'your-token',
        buttonText: 'Register Now',
        onComplete: (order) => {
          console.log('Registration complete!', order);
          window.location.href = '/thank-you';
        }
      }),
      document.getElementById('registration-root')
    );
  </script>
</body>
</html>
```

---

## 🔧 Configuration Options

### Authentication Props

```jsx
{
  // OAuth
  authUser: (provider) => {
    // Handle login with provider (google, facebook, etc.)
  },

  // Passwordless
  getPasswordlessCode: (email) => {
    // Send OTP code
    return Promise.resolve({ otp_length: 6, otp_lifetime: 600 });
  },
  loginWithCode: (code, email) => {
    // Verify OTP and login
    return Promise.resolve();
  },

  // Token
  getAccessToken: () => {
    return localStorage.getItem('access_token');
  },

  // Options
  allowsNativeAuth: true,
  allowsOtpAuth: true,
  loginOptions: [
    { provider_label: 'Google', provider_param: 'google', button_color: '#4285F4' },
    { provider_label: 'Facebook', provider_param: 'facebook', button_color: '#1877F2' }
  ]
}
```

### Customization Props

```jsx
{
  // UI Text
  buttonText: 'Buy Tickets',
  modalTitle: 'Event Registration',
  supportEmail: 'support@example.com',

  // Features
  allowPromoCodes: true,
  showCompanyInput: true,
  hidePostalCode: false,

  // Branding
  marketingData: {
    primaryColor: '#007bff',
    secondaryColor: '#6c757d'
  },
  idpLogoLight: '/logo-light.svg',
  idpLogoDark: '/logo-dark.svg',

  // Messages
  noAllowedTicketsMessage: 'No tickets available',
  inPersonDisclaimer: 'Masks required'
}
```

---

## 📱 Mobile Optimization

The library is fully mobile-optimized:
- Responsive modal sizing
- Touch-friendly controls
- Optimized for on-site registration
- No scroll bounce
- Full viewport on mobile

---

## 🎯 Best Practices

1. **Use RegistrationButton for simplicity** - It handles everything
2. **Use RegistrationForm for dedicated pages** - Better mobile UX
3. **Always provide onComplete callback** - Handle success your way
4. **Don't navigate in the library** - Library calls callbacks, you decide what to do
5. **Test on mobile devices** - Most registrations happen on-site

---

## 🔄 Migration from Legacy Widget

**Old (v1):**
```jsx
<RegistrationLiteWidget
  {...50+ props}
  closeWidget={() => setIsActive(false)}
/>
```

**New (v2):**
```jsx
<RegistrationButton
  {...essentialProps}
  onComplete={(order) => {/* you decide */}}
/>
```

---

## 🐛 Troubleshooting

### Modal doesn't close
Make sure you're calling `onCancel` or managing `isOpen` state

### Button doesn't appear
Check that CSS is imported: `import 'summit-registration-lite/dist/index.css'`

### API errors
Verify `apiBaseUrl`, `clientId`, and `getAccessToken` are correct

---

## 📚 Full API Reference

See PropTypes in each component file for complete prop documentation:
- `RegistrationButton.js`
- `RegistrationForm.js`
- `RegistrationModal.js`
