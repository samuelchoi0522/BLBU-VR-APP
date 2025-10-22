import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        text: {
            primary: "#000000",   // all primary text = black
            secondary: "#000000", // secondary text = black too
        },
    },
    typography: {
        allVariants: {
            color: "#000000",     // makes absolutely all typography black
        },
    },
});

export default theme;
