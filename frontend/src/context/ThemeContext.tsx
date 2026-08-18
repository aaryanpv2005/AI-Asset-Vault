"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";

interface ThemeContextType {
    darkMode: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    darkMode: false,
    toggleTheme: () => {},
});

export function ThemeProvider({
    children,
}: {
    children: ReactNode;
}) {

    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {

        const savedTheme = localStorage.getItem("theme");

        if (savedTheme === "dark") {
            setDarkMode(true);
        }

    }, []);

    useEffect(() => {

        localStorage.setItem(
            "theme",
            darkMode ? "dark" : "light"
        );

    }, [darkMode]);

    const toggleTheme = () => {
        setDarkMode(!darkMode);
    };

    return (

        <ThemeContext.Provider
            value={{
                darkMode,
                toggleTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>

    );
}

export const useTheme = () => useContext(ThemeContext);