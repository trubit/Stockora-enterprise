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
      default: '#0b0f19', // Deep dark slate
      paper: '#111827', // Slate secondary
    },
    text: {
      primary: '#f3f4f6',
      secondary: '#9ca3af',
      disabled: '#4b5563',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    error: {
      main: '#ef4444',
    },
    warning: {
      main: '#f59e0b',
    },
    info: {
      main: '#3b82f6',
    },
    success: {
      main: '#10b981',
    },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: '-0.015em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 400,
    },
    body1: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.925rem',
      lineHeight: 1.6,
    },
    body2: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.825rem',
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
          padding: '8px 16px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)',
          },
        },
        containedSecondary: {
          '&:hover': {
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.3)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 30px 0 rgba(0, 0, 0, 0.4)',
          },
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
              background: 'linear-gradient(135deg, rgba(23, 27, 44, 0.98) 0%, rgba(11, 13, 26, 0.99) 100%) !important',
              backdropFilter: 'none !important',
              border: '1px solid rgba(139, 92, 246, 0.2) !important',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5) !important',
            },
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          pointerEvents: 'none !important',
          '&.MuiInputLabel-shrink': {
            backgroundColor: '#121420 !important',
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
          backdropFilter: 'none !important',
          transition: 'none !important',
          '& .MuiOutlinedInput-input': {
            color: '#f3f4f6',
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: '#f3f4f6',
          '&:hover': {
            backgroundColor: 'rgba(139, 92, 246, 0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(139, 92, 246, 0.16)',
            color: '#ffffff',
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
        head: {
          fontWeight: 600,
          backgroundColor: '#1f2937',
          color: '#f3f4f6',
        },
      },
    },
  },
});
export default theme;
