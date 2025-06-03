// utils/fonts.js

const fontStyles = (weight) => {
    const fonts = {
      regular: { fontFamily: "Figtree-Regular" },
      medium: { fontFamily: "Figtree-Medium" },
      semibold: { fontFamily: "Figtree-SemiBold" },
      bold: { fontFamily: "Figtree-Bold" },
      extrabold: { fontFamily: "Figtree-ExtraBold" },
    };
  
    return fonts[weight] || fonts.regular;
  };
  
  export default fontStyles;
  