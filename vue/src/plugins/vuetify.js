/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'
// import { VuetifyDateAdapter } from 'vuetify/date/adapters/vuetify'

// Locales
import { uk } from 'vuetify/locale'
import { md3 } from 'vuetify/blueprints'
import colors from 'vuetify/lib/util/colors'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify(
  {
  // date: {
  //   adapter: VuetifyDateAdapter,
  // },
  
  blueprint: md3,
  locale: {
    locale: 'uk',
    fallback: 'uk',
    messages: { uk }
  },
  defaults: {
    global: {
      ripple: true,
      density: 'comfortable',
    },
    VSheet: {
      elevation: 4,
    },
    VChip: {
      rounded: true,
    },
    VBtn: {
    },
    VAppBar: {
    },

    VAutocomplete: {
      variant: "outlined",
      density: 'compact',
    },
    VSelect: {
      variant: "outlined",
      density: 'compact',
    },
    VTextField: {
      variant: "outlined",
      density: 'compact',
    },
    VList: {
      density: "compact",
    },
    VSwitch: {
      color: "primary",
      density: "compact",
      hideDetails: true,
    },
    VCheckbox: {
      density: "compact",
      hideDetails: true,
    }

  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          // primary: colors.red.darken3, //можна встановлювати стандартні кольори MD
          primary: "#e40040",
          secondary: "#b4b0bb",
          tertiary: "#7d5260",
          background: "#FFFFFF",
          success: "#4CAF50",
          warning: "#FB8C00"  ,        
          error: "#b3261e",
          info: "#2196F3",
          surface: "#fffbfe",
          "on-surface-variant": "#EEEEEE",
          "surface-variant": "#424242",
          "primary-darken-1": "#3700B3",
          "secondary-darken-1": "#018786",
          header: colors.teal.darken4,
          headerBlk: colors.teal.lighten4,
          "header-btn": "#FFFFFF",
          "dialog-header": colors.blueGrey.base,
          "dialog-header-btn":"#FFFFFF",
          "left-menu": colors.blueGrey.darken1,
          "left-menu-next": colors.blueGrey.lighten4,
          "table-header": colors.blueGrey.lighten5,
        },
      },
      dark: {
        colors: {
          primary: "#BB86FC", 
          secondary: "#03DAC5",
          background: "#121212", 
          success: "#4CAF50",
          warning: "#FB8C00",
          error: "#CF6679", 
          info: "#2196F3", 
          surface: "#212121",
          "surface-variant": "#BDBDBD",
          "on-surface-variant": "#424242", 
          "primary-darken-1": "#3700B3",
          "secondary-darken-1": "#03DAC5",
          // header: colors.blueGrey.darken4,
          // "dialog-header": colors.blueGrey.base
        },
      },
    },
  },
})
