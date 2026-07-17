import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#8b5cf6', // Violet
      light: '#a78bfa',
      dark: '#7c3aed',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#10b981', // Emerald green
      light: '#34d399',
      dark: '#059669',
      contrastText: '#ffffff',
    },
    background: {
      default: '#07090e', // Deep rich dark primary background
      paper: '#0f131f', // Rich dark secondary card/paper background
    },
    text: {
      primary: '#f3f4f6',
      secondary: '#9ca3af',
      disabled: '#4b5563',
    },
    divider: 'rgba(255, 255, 255, 0.05)',
    error: {
      main: '#ef4444',
      light: '#f87171',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
    },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '2.5rem',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 800,
      fontSize: '2rem',
      letterSpacing: '-0.015em',
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.75rem',
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.5rem',
      letterSpacing: '-0.01em',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    body1: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.9rem',
      lineHeight: 1.6,
    },
    body2: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.8rem',
      lineHeight: 1.5,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 18px',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 14px rgba(139, 92, 246, 0.2)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        containedSecondary: {
          '&:hover': {
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#0f131f',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: 16,
          '&:hover': {
            borderColor: 'rgba(139, 92, 246, 0.25)',
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
          },
        },
      },
    },
    MuiDialog: {
      defaultProps: {
        disableRestoreFocus: true,
      },
      styleOverrides: {
        paper: {
          background: 'linear-gradient(135deg, #0f1322 0%, #07090e 100%) !important',
          border: '1px solid rgba(139, 92, 246, 0.2) !important',
          borderRadius: '16px !important',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7) !important',
          padding: '12px !important',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          paddingBottom: '8px !important',
          fontSize: '1.35rem',
          fontWeight: 800,
          background: 'linear-gradient(90deg, #c084fc 0%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '0.01em',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          paddingTop: '20px !important',
          paddingBottom: '16px !important',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px !important',
          borderTop: '1px solid rgba(255, 255, 255, 0.05) !important',
        },
      },
    },
    MuiSelect: {
      defaultProps: {
        MenuProps: {
          disablePortal: false,
          sx: {
            zIndex: '2000 !important',
          },
          PaperProps: {
            sx: {
              background: 'linear-gradient(135deg, #0f1322 0%, #07090e 100%) !important',
              border: '1px solid rgba(139, 92, 246, 0.15) !important',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6) !important',
            },
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          pointerEvents: 'none !important',
          color: '#9ca3af !important',
          '&.Mui-focused': {
            color: '#a78bfa !important',
          },
          '&.MuiInputLabel-shrink': {
            backgroundColor: '#07090e !important',
            padding: '0 8px !important',
            borderRadius: '4px !important',
            pointerEvents: 'none !important',
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: '#f3f4f6',
        },
        input: {
          color: '#f3f4f6',
        },
      },
    },
    MuiOutlinedInput: {
      defaultProps: {
        notched: true,
      },
      styleOverrides: {
        root: {
          color: '#f3f4f6',
          backgroundColor: 'rgba(15, 21, 36, 0.3) !important',
          borderRadius: '10px !important',
          '& fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.05) !important',
            transition: 'border-color 0.2s ease !important',
          },
          '&:hover fieldset': {
            borderColor: 'rgba(139, 92, 246, 0.25) !important',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#8b5cf6 !important',
            borderWidth: '1px !important',
          },
          '&.Mui-focused': {
            boxShadow: '0 0 16px rgba(139, 92, 246, 0.15) !important',
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: '#f3f4f6',
          borderRadius: '6px',
          margin: '2px 6px',
          padding: '8px 12px',
          '&:hover': {
            backgroundColor: 'rgba(139, 92, 246, 0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
            },
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.03) !important',
          padding: '16px 20px',
        },
        head: {
          fontWeight: 700,
          backgroundColor: 'rgba(15, 21, 36, 0.8) !important',
          color: '#a78bfa !important',
          borderBottom: '1px solid rgba(139, 92, 246, 0.15) !important',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.06em',
        },
      },
    },
  },
});

export default theme;
