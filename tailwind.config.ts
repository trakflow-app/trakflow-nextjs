export default {
    theme: {
        extend: {
            colors: {
                primary: "var(--color-primary)",
                "text-primary": "var(--color-text-primary)",
            },
            spacing: {
                1: "var(--space-1)",
                2: "var(--space-2)",
            },
            borderRadius: {
                md: "var(--radius-md)",
            },
            boxShadow: {
                sm: "var(--shadow-sm)",
                md: "var(--shadow-md)",
            },
            animation: {
                "fast": "var(--duration-fast)",
                "normal": "var(--duration-normal)",
            },
            easing: {
                standard: "var(--easing-standard)",
            },
        },
    }
}