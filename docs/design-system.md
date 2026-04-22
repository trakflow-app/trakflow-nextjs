# DESIGN TOKEN ARCHITECTURE

### Trakflow Design System

This document defines the design token structure used across the Trakflow application. Tokens are organized into three layers:

1. Base (Primitive) Tokens – raw values (colors, typography, spacing)
2. Semantic Tokens – meaning-based aliases used in UI
3. Component Tokens – optional layer for component-specific styling

## BASE TOKENS

#### Colors (Primitive)

brand.primary = #212431  
brand.secondary = #EA5C1F  
brand.tertirary = #4F5D75
brand.white = #F5F5F5

#### Typography (Primitive)

font.family.heading = Google Sans, system-ui, sans-serif  
font.family.sans = Inter, system-ui, sans-serif

font.size.xs = 12px  
font.size.sm = 14px  
font.size.md = 16px  
font.size.lg = 18px  
font.size.xl = 20px  
font.size.2xl = 24px  
font.size.3xl = 30px

font.weight.regular = 400  
font.weight.medium = 500  
font.weight.semibold = 600  
font.weight.bold = 700

line.height.tight = 1.2  
line.height.normal = 1.5  
line.height.relaxed = 1.7

#### Spacing

space.1 = 4px  
space.2 = 8px  
space.3 = 12px  
space.4 = 16px  
space.5 = 20px  
space.6 = 24px  
space.8 = 32px  
space.10 = 40px  
space.12 = 48px

#### Radius

radius.sm = 6px  
radius.md = 8px  
radius.lg = 12px  
radius.xl = 16px  
radius.full = 9999px

## SEMANTIC TOKENS

color.background.primary = brand.white  
color.background.subtle = #F7F8FA

color.text.primary = #212431  
color.text.secondary = #4F5D75
color.text.muted = #6B7280

color.button.primary.bg = #212431  
color.button.primary.text = #F5F5F5

#### Actions

color.action.primary = brand.secondary  
color.action.primary.foreground = brand.white  
color.action.secondary = brand.tertiary  
color.action.secondary.foreground = brand.white

#### States

color.success = #1F8F55  
color.warning = #E4A80F  
color.error = #C62828

#### Border and Input

color.border.default = #D8DEE8
color.input.default = #D8DEE8
color.ring = brand.secondary

#### Surface

color.card = brand.white
color.card.foreground = brand.primary
color.popover = brand.white
color.popover.foreground = brand.primary

## COMPONENT TOKENS

button.primary.background = color.action.primary  
button.primary.text = color.action.primary.foreground  
button.primary.radius = radius.md  
button.primary.padding.x = space.4  
button.primary.padding.y = space.2

## THEMING

#### Light Mode

background = color.background.primary  
foreground = color.text.primary

#### Dark Mode

background = #181C27  
foreground = #F8FAFC  
card = #202534  
border = #31384A

## SPACING TOKENS

space.1 = 4px  
space.2 = 8px  
space.3 = 12px  
space.4 = 16px

## RADIUS TOKENS

radius.sm = 4px  
radius.md = 8px  
radius.ls = 12px

## SHADOW TOKENS

shadow.sm = 0 1px 2px rgba(0,0,0,0.05)  
shadow.md = 0 4px 6px rgba(0,0,0,0.1)

## MOTION TOKENS

duration.fast = 150ms  
duration.normal = 250ms  
easing.standard = cubic-beizer(...)
