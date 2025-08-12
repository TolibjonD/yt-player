'use client';

import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "@/components/error-boundary";
import playerReducer from '@/store/playerSlice';

// Create Redux store with proper player slice
const store = configureStore({
    reducer: {
        player: playerReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
            immutableCheck: false,
        }),
    devTools: process.env.NODE_ENV === 'development',
});

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary>
            <Provider store={store}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                    <Toaster
                        position="bottom-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(20px)',
                                borderRadius: '12px',
                                padding: '16px',
                                fontSize: '14px',
                                fontWeight: '500',
                            },
                        }}
                    />
                </ThemeProvider>
            </Provider>
        </ErrorBoundary>
    );
}

// Export store for use in components
export { store };
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
