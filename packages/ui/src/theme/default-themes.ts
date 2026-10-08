import type { DesktopTheme } from "./types"
import oc2ThemeJson from "./themes/oc-2.json"
import amoledThemeJson from "./themes/amoled.json"
import auraThemeJson from "./themes/aura.json"
import ayuThemeJson from "./themes/ayu.json"
import carbonfoxThemeJson from "./themes/carbonfox.json"
import catppuccinThemeJson from "./themes/catppuccin.json"
import catppuccinFrappeThemeJson from "./themes/catppuccin-frappe.json"
import catppuccinMacchiatoThemeJson from "./themes/catppuccin-macchiato.json"
import cobalt2ThemeJson from "./themes/cobalt2.json"
import cursorThemeJson from "./themes/cursor.json"
import draculaThemeJson from "./themes/dracula.json"
import everforestThemeJson from "./themes/everforest.json"
import flexokiThemeJson from "./themes/flexoki.json"
import githubThemeJson from "./themes/github.json"
import gruvboxThemeJson from "./themes/gruvbox.json"
import kanagawaThemeJson from "./themes/kanagawa.json"
import lucentOrngThemeJson from "./themes/lucent-orng.json"
import materialThemeJson from "./themes/material.json"
import matrixThemeJson from "./themes/matrix.json"
import mercuryThemeJson from "./themes/mercury.json"
import monokaiThemeJson from "./themes/monokai.json"
import nightowlThemeJson from "./themes/nightowl.json"
import nordThemeJson from "./themes/nord.json"
import oneDarkThemeJson from "./themes/one-dark.json"
import oneDarkProThemeJson from "./themes/onedarkpro.json"
import opencodeThemeJson from "./themes/opencode.json"
import orngThemeJson from "./themes/orng.json"
import osakaJadeThemeJson from "./themes/osaka-jade.json"
import palenightThemeJson from "./themes/palenight.json"
import rosepineThemeJson from "./themes/rosepine.json"
import shadesOfPurpleThemeJson from "./themes/shadesofpurple.json"
import solarizedThemeJson from "./themes/solarized.json"
import synthwave84ThemeJson from "./themes/synthwave84.json"
import tokyonightThemeJson from "./themes/tokyonight.json"
import vercelThemeJson from "./themes/vercel.json"
import vesperThemeJson from "./themes/vesper.json"
import zenburnThemeJson from "./themes/zenburn.json"
import colorway90sAnimeThemeJson from "./themes/90s-anime.json"
import colorwayAdaptaEvergreenThemeJson from "./themes/adapta-evergreen.json"
import colorwayBerryNebulaThemeJson from "./themes/berry-nebula.json"
import colorwayCatppuccinFrappBlueThemeJson from "./themes/catppuccin-frapp-blue.json"
import colorwayCatppuccinFrappGreenThemeJson from "./themes/catppuccin-frapp-green.json"
import colorwayCatppuccinFrappLavenderThemeJson from "./themes/catppuccin-frapp-lavender.json"
import colorwayCatppuccinFrappMaroonThemeJson from "./themes/catppuccin-frapp-maroon.json"
import colorwayCatppuccinFrappPeachThemeJson from "./themes/catppuccin-frapp-peach.json"
import colorwayCatppuccinFrappPinkThemeJson from "./themes/catppuccin-frapp-pink.json"
import colorwayCatppuccinFrappRedThemeJson from "./themes/catppuccin-frapp-red.json"
import colorwayCatppuccinFrappRosewaterThemeJson from "./themes/catppuccin-frapp-rosewater.json"
import colorwayCatppuccinFrappTealThemeJson from "./themes/catppuccin-frapp-teal.json"
import colorwayCatppuccinFrappYellowThemeJson from "./themes/catppuccin-frapp-yellow.json"
import colorwayCatppuccinMacchiatoBlueThemeJson from "./themes/catppuccin-macchiato-blue.json"
import colorwayCatppuccinMacchiatoGreenThemeJson from "./themes/catppuccin-macchiato-green.json"
import colorwayCatppuccinMacchiatoLavenderThemeJson from "./themes/catppuccin-macchiato-lavender.json"
import colorwayCatppuccinMacchiatoMaroonThemeJson from "./themes/catppuccin-macchiato-maroon.json"
import colorwayCatppuccinMacchiatoPeachThemeJson from "./themes/catppuccin-macchiato-peach.json"
import colorwayCatppuccinMacchiatoPinkThemeJson from "./themes/catppuccin-macchiato-pink.json"
import colorwayCatppuccinMacchiatoRedThemeJson from "./themes/catppuccin-macchiato-red.json"
import colorwayCatppuccinMacchiatoRosewaterThemeJson from "./themes/catppuccin-macchiato-rosewater.json"
import colorwayCatppuccinMacchiatoTealThemeJson from "./themes/catppuccin-macchiato-teal.json"
import colorwayCatppuccinMacchiatoYellowThemeJson from "./themes/catppuccin-macchiato-yellow.json"
import colorwayCatppuccinMochaThemeJson from "./themes/catppuccin-mocha.json"
import colorwayCatppuccinMochaBlueThemeJson from "./themes/catppuccin-mocha-blue.json"
import colorwayCatppuccinMochaGreenThemeJson from "./themes/catppuccin-mocha-green.json"
import colorwayCatppuccinMochaLavenderThemeJson from "./themes/catppuccin-mocha-lavender.json"
import colorwayCatppuccinMochaMaroonThemeJson from "./themes/catppuccin-mocha-maroon.json"
import colorwayCatppuccinMochaPeachThemeJson from "./themes/catppuccin-mocha-peach.json"
import colorwayCatppuccinMochaPinkThemeJson from "./themes/catppuccin-mocha-pink.json"
import colorwayCatppuccinMochaRedThemeJson from "./themes/catppuccin-mocha-red.json"
import colorwayCatppuccinMochaRosewaterThemeJson from "./themes/catppuccin-mocha-rosewater.json"
import colorwayCatppuccinMochaTealThemeJson from "./themes/catppuccin-mocha-teal.json"
import colorwayCatppuccinMochaYellowThemeJson from "./themes/catppuccin-mocha-yellow.json"
import colorwayCatppuccinSiblingAffogatoThemeJson from "./themes/catppuccin-sibling-affogato.json"
import colorwayCatppuccinSiblingGarnetThemeJson from "./themes/catppuccin-sibling-garnet.json"
import colorwayCatppuccinSiblingLichenThemeJson from "./themes/catppuccin-sibling-lichen.json"
import colorwayCatppuccinSiblingMatchaThemeJson from "./themes/catppuccin-sibling-matcha.json"
import colorwayCatppuccinSiblingPetalThemeJson from "./themes/catppuccin-sibling-petal.json"
import colorwayCatppuccinSiblingSesameThemeJson from "./themes/catppuccin-sibling-sesame.json"
import colorwayCatppuccinSiblingTerracottaThemeJson from "./themes/catppuccin-sibling-terracotta.json"
import colorwayCatppuccinSiblingUbeThemeJson from "./themes/catppuccin-sibling-ube.json"
import colorwayClaudeCodeThemeJson from "./themes/claude-code.json"
import colorwayClaudeCodeWarmThemeJson from "./themes/claude-code-warm.json"
import colorwayClaudeDarkThemeJson from "./themes/claude-dark.json"
import colorwayCyclope6ThemeJson from "./themes/cyclope6.json"
import colorwayDarkHorizonThemeJson from "./themes/dark-horizon.json"
import colorwayDarkMagicThemeJson from "./themes/dark-magic.json"
import colorwayDraculaRefinedThemeJson from "./themes/dracula-refined.json"
import colorwayDustyDunesThemeJson from "./themes/dusty-dunes.json"
import colorwayDustyDunesDarkerThemeJson from "./themes/dusty-dunes-darker.json"
import colorwayEarthboundThemeJson from "./themes/earthbound.json"
import colorwayEarthboundDarkerThemeJson from "./themes/earthbound-darker.json"
import colorwayEtherealDefaultThemeJson from "./themes/ethereal-default.json"
import colorwayEtherealFallenAngelThemeJson from "./themes/ethereal-fallen-angel.json"
import colorwayEtherealFrutigerThemeJson from "./themes/ethereal-frutiger.json"
import colorwayEtherealGothicAngelThemeJson from "./themes/ethereal-gothic-angel.json"
import colorwayEtherealKerubinThemeJson from "./themes/ethereal-kerubin.json"
import colorwayEtherealLuminousSpaceThemeJson from "./themes/ethereal-luminous-space.json"
import colorwayEtherealWindows7ThemeJson from "./themes/ethereal-windows-7.json"
import colorwayEtherealY2KAeroThemeJson from "./themes/ethereal-y2-k-aero.json"
import colorwayEverforestDarkHardThemeJson from "./themes/everforest-dark-hard.json"
import colorwayEverforestDarkSoftThemeJson from "./themes/everforest-dark-soft.json"
import colorwayEvondevAuthorContrastThemeJson from "./themes/evondev-author-contrast.json"
import colorwayEvondevDraculaThemeJson from "./themes/evondev-dracula.json"
import colorwayEvondevNewContrastThemeJson from "./themes/evondev-new-contrast.json"
import colorwayEvondevNightContrastThemeJson from "./themes/evondev-night-contrast.json"
import colorwayFairyflossThemeJson from "./themes/fairyfloss.json"
import colorwayFireSpringThemeJson from "./themes/fire-spring.json"
import colorwayFireSpringDarkerThemeJson from "./themes/fire-spring-darker.json"
import colorwayFluffyDarkThemeJson from "./themes/fluffy-dark.json"
import colorwayHatsuneMikuThemeJson from "./themes/hatsune-miku.json"
import colorwayHydrangea11ThemeJson from "./themes/hydrangea-11.json"
import colorwayInkCrimsonThemeJson from "./themes/ink-crimson.json"
import colorwayKawaiiThemeJson from "./themes/kawaii.json"
import colorwayKickDarkThemeJson from "./themes/kick-dark.json"
import colorwayLoFiGreenDarkThemeJson from "./themes/lo-fi-green-dark.json"
import colorwayMatchalkThemeJson from "./themes/matchalk.json"
import colorwayMikuBetterThemeJson from "./themes/miku-better.json"
import colorwayModernPurpleThemeJson from "./themes/modern-purple.json"
import colorwayMoonsideThemeJson from "./themes/moonside.json"
import colorwayNopal12ThemeJson from "./themes/nopal-12.json"
import colorwayPastelPixelsThemeJson from "./themes/pastel-pixels.json"
import colorwayPinkGlazeMacaroonThemeJson from "./themes/pink-glaze-macaroon.json"
import colorwayRosPineFoamThemeJson from "./themes/ros-pine-foam.json"
import colorwayRosPineGoldThemeJson from "./themes/ros-pine-gold.json"
import colorwayRosPineIrisThemeJson from "./themes/ros-pine-iris.json"
import colorwayRosPineLoveThemeJson from "./themes/ros-pine-love.json"
import colorwayRosPinePineThemeJson from "./themes/ros-pine-pine.json"
import colorwayRosPineRoseThemeJson from "./themes/ros-pine-rose.json"
import colorwayRosePineMoonFoamThemeJson from "./themes/rose-pine-moon-foam.json"
import colorwayRosePineMoonGoldThemeJson from "./themes/rose-pine-moon-gold.json"
import colorwayRosePineMoonIrisThemeJson from "./themes/rose-pine-moon-iris.json"
import colorwayRosePineMoonLoveThemeJson from "./themes/rose-pine-moon-love.json"
import colorwayRosePineMoonPineThemeJson from "./themes/rose-pine-moon-pine.json"
import colorwayRosePineMoonRoseThemeJson from "./themes/rose-pine-moon-rose.json"
import colorwaySailorMoonBackgroundThemeJson from "./themes/sailor-moon-background.json"
import colorwaySeafoamThemeJson from "./themes/seafoam.json"
import colorwaySlso8PixelsThemeJson from "./themes/slso8-pixels.json"
import colorwaySoapy10ThemeJson from "./themes/soapy-10.json"
import colorwaySolarizedDarkThemeJson from "./themes/solarized-dark.json"
import colorwaySpiritedAwayThemeJson from "./themes/spirited-away.json"
import colorwayTwitchDarkThemeJson from "./themes/twitch-dark.json"
import colorwayYouTubeDarkThemeJson from "./themes/you-tube-dark.json"
import colorwayZombieThreedThemeJson from "./themes/zombie-threed.json"
import colorwayZombieThreedDarkerThemeJson from "./themes/zombie-threed-darker.json"

export const oc2Theme = oc2ThemeJson as DesktopTheme
export const amoledTheme = amoledThemeJson as DesktopTheme
export const auraTheme = auraThemeJson as DesktopTheme
export const ayuTheme = ayuThemeJson as DesktopTheme
export const carbonfoxTheme = carbonfoxThemeJson as DesktopTheme
export const catppuccinTheme = catppuccinThemeJson as DesktopTheme
export const catppuccinFrappeTheme = catppuccinFrappeThemeJson as DesktopTheme
export const catppuccinMacchiatoTheme = catppuccinMacchiatoThemeJson as DesktopTheme
export const cobalt2Theme = cobalt2ThemeJson as DesktopTheme
export const cursorTheme = cursorThemeJson as DesktopTheme
export const draculaTheme = draculaThemeJson as DesktopTheme
export const everforestTheme = everforestThemeJson as DesktopTheme
export const flexokiTheme = flexokiThemeJson as DesktopTheme
export const githubTheme = githubThemeJson as DesktopTheme
export const gruvboxTheme = gruvboxThemeJson as DesktopTheme
export const kanagawaTheme = kanagawaThemeJson as DesktopTheme
export const lucentOrngTheme = lucentOrngThemeJson as DesktopTheme
export const materialTheme = materialThemeJson as DesktopTheme
export const matrixTheme = matrixThemeJson as DesktopTheme
export const mercuryTheme = mercuryThemeJson as DesktopTheme
export const monokaiTheme = monokaiThemeJson as DesktopTheme
export const nightowlTheme = nightowlThemeJson as DesktopTheme
export const nordTheme = nordThemeJson as DesktopTheme
export const oneDarkTheme = oneDarkThemeJson as DesktopTheme
export const oneDarkProTheme = oneDarkProThemeJson as DesktopTheme
export const opencodeTheme = opencodeThemeJson as DesktopTheme
export const orngTheme = orngThemeJson as DesktopTheme
export const osakaJadeTheme = osakaJadeThemeJson as DesktopTheme
export const palenightTheme = palenightThemeJson as DesktopTheme
export const rosepineTheme = rosepineThemeJson as DesktopTheme
export const shadesOfPurpleTheme = shadesOfPurpleThemeJson as DesktopTheme
export const solarizedTheme = solarizedThemeJson as DesktopTheme
export const synthwave84Theme = synthwave84ThemeJson as DesktopTheme
export const tokyonightTheme = tokyonightThemeJson as DesktopTheme
export const vercelTheme = vercelThemeJson as DesktopTheme
export const vesperTheme = vesperThemeJson as DesktopTheme
export const zenburnTheme = zenburnThemeJson as DesktopTheme
export const colorway90sAnimeTheme = colorway90sAnimeThemeJson as DesktopTheme
export const colorwayAdaptaEvergreenTheme = colorwayAdaptaEvergreenThemeJson as DesktopTheme
export const colorwayBerryNebulaTheme = colorwayBerryNebulaThemeJson as DesktopTheme
export const colorwayCatppuccinFrappBlueTheme = colorwayCatppuccinFrappBlueThemeJson as DesktopTheme
export const colorwayCatppuccinFrappGreenTheme = colorwayCatppuccinFrappGreenThemeJson as DesktopTheme
export const colorwayCatppuccinFrappLavenderTheme = colorwayCatppuccinFrappLavenderThemeJson as DesktopTheme
export const colorwayCatppuccinFrappMaroonTheme = colorwayCatppuccinFrappMaroonThemeJson as DesktopTheme
export const colorwayCatppuccinFrappPeachTheme = colorwayCatppuccinFrappPeachThemeJson as DesktopTheme
export const colorwayCatppuccinFrappPinkTheme = colorwayCatppuccinFrappPinkThemeJson as DesktopTheme
export const colorwayCatppuccinFrappRedTheme = colorwayCatppuccinFrappRedThemeJson as DesktopTheme
export const colorwayCatppuccinFrappRosewaterTheme = colorwayCatppuccinFrappRosewaterThemeJson as DesktopTheme
export const colorwayCatppuccinFrappTealTheme = colorwayCatppuccinFrappTealThemeJson as DesktopTheme
export const colorwayCatppuccinFrappYellowTheme = colorwayCatppuccinFrappYellowThemeJson as DesktopTheme
export const colorwayCatppuccinMacchiatoBlueTheme = colorwayCatppuccinMacchiatoBlueThemeJson as DesktopTheme
export const colorwayCatppuccinMacchiatoGreenTheme = colorwayCatppuccinMacchiatoGreenThemeJson as DesktopTheme
export const colorwayCatppuccinMacchiatoLavenderTheme = colorwayCatppuccinMacchiatoLavenderThemeJson as DesktopTheme
export const colorwayCatppuccinMacchiatoMaroonTheme = colorwayCatppuccinMacchiatoMaroonThemeJson as DesktopTheme
export const colorwayCatppuccinMacchiatoPeachTheme = colorwayCatppuccinMacchiatoPeachThemeJson as DesktopTheme
export const colorwayCatppuccinMacchiatoPinkTheme = colorwayCatppuccinMacchiatoPinkThemeJson as DesktopTheme
export const colorwayCatppuccinMacchiatoRedTheme = colorwayCatppuccinMacchiatoRedThemeJson as DesktopTheme
export const colorwayCatppuccinMacchiatoRosewaterTheme = colorwayCatppuccinMacchiatoRosewaterThemeJson as DesktopTheme
export const colorwayCatppuccinMacchiatoTealTheme = colorwayCatppuccinMacchiatoTealThemeJson as DesktopTheme
export const colorwayCatppuccinMacchiatoYellowTheme = colorwayCatppuccinMacchiatoYellowThemeJson as DesktopTheme
export const colorwayCatppuccinMochaTheme = colorwayCatppuccinMochaThemeJson as DesktopTheme
export const colorwayCatppuccinMochaBlueTheme = colorwayCatppuccinMochaBlueThemeJson as DesktopTheme
export const colorwayCatppuccinMochaGreenTheme = colorwayCatppuccinMochaGreenThemeJson as DesktopTheme
export const colorwayCatppuccinMochaLavenderTheme = colorwayCatppuccinMochaLavenderThemeJson as DesktopTheme
export const colorwayCatppuccinMochaMaroonTheme = colorwayCatppuccinMochaMaroonThemeJson as DesktopTheme
export const colorwayCatppuccinMochaPeachTheme = colorwayCatppuccinMochaPeachThemeJson as DesktopTheme
export const colorwayCatppuccinMochaPinkTheme = colorwayCatppuccinMochaPinkThemeJson as DesktopTheme
export const colorwayCatppuccinMochaRedTheme = colorwayCatppuccinMochaRedThemeJson as DesktopTheme
export const colorwayCatppuccinMochaRosewaterTheme = colorwayCatppuccinMochaRosewaterThemeJson as DesktopTheme
export const colorwayCatppuccinMochaTealTheme = colorwayCatppuccinMochaTealThemeJson as DesktopTheme
export const colorwayCatppuccinMochaYellowTheme = colorwayCatppuccinMochaYellowThemeJson as DesktopTheme
export const colorwayCatppuccinSiblingAffogatoTheme = colorwayCatppuccinSiblingAffogatoThemeJson as DesktopTheme
export const colorwayCatppuccinSiblingGarnetTheme = colorwayCatppuccinSiblingGarnetThemeJson as DesktopTheme
export const colorwayCatppuccinSiblingLichenTheme = colorwayCatppuccinSiblingLichenThemeJson as DesktopTheme
export const colorwayCatppuccinSiblingMatchaTheme = colorwayCatppuccinSiblingMatchaThemeJson as DesktopTheme
export const colorwayCatppuccinSiblingPetalTheme = colorwayCatppuccinSiblingPetalThemeJson as DesktopTheme
export const colorwayCatppuccinSiblingSesameTheme = colorwayCatppuccinSiblingSesameThemeJson as DesktopTheme
export const colorwayCatppuccinSiblingTerracottaTheme = colorwayCatppuccinSiblingTerracottaThemeJson as DesktopTheme
export const colorwayCatppuccinSiblingUbeTheme = colorwayCatppuccinSiblingUbeThemeJson as DesktopTheme
export const colorwayClaudeCodeTheme = colorwayClaudeCodeThemeJson as DesktopTheme
export const colorwayClaudeCodeWarmTheme = colorwayClaudeCodeWarmThemeJson as DesktopTheme
export const colorwayClaudeDarkTheme = colorwayClaudeDarkThemeJson as DesktopTheme
export const colorwayCyclope6Theme = colorwayCyclope6ThemeJson as DesktopTheme
export const colorwayDarkHorizonTheme = colorwayDarkHorizonThemeJson as DesktopTheme
export const colorwayDarkMagicTheme = colorwayDarkMagicThemeJson as DesktopTheme
export const colorwayDraculaRefinedTheme = colorwayDraculaRefinedThemeJson as DesktopTheme
export const colorwayDustyDunesTheme = colorwayDustyDunesThemeJson as DesktopTheme
export const colorwayDustyDunesDarkerTheme = colorwayDustyDunesDarkerThemeJson as DesktopTheme
export const colorwayEarthboundTheme = colorwayEarthboundThemeJson as DesktopTheme
export const colorwayEarthboundDarkerTheme = colorwayEarthboundDarkerThemeJson as DesktopTheme
export const colorwayEtherealDefaultTheme = colorwayEtherealDefaultThemeJson as DesktopTheme
export const colorwayEtherealFallenAngelTheme = colorwayEtherealFallenAngelThemeJson as DesktopTheme
export const colorwayEtherealFrutigerTheme = colorwayEtherealFrutigerThemeJson as DesktopTheme
export const colorwayEtherealGothicAngelTheme = colorwayEtherealGothicAngelThemeJson as DesktopTheme
export const colorwayEtherealKerubinTheme = colorwayEtherealKerubinThemeJson as DesktopTheme
export const colorwayEtherealLuminousSpaceTheme = colorwayEtherealLuminousSpaceThemeJson as DesktopTheme
export const colorwayEtherealWindows7Theme = colorwayEtherealWindows7ThemeJson as DesktopTheme
export const colorwayEtherealY2KAeroTheme = colorwayEtherealY2KAeroThemeJson as DesktopTheme
export const colorwayEverforestDarkHardTheme = colorwayEverforestDarkHardThemeJson as DesktopTheme
export const colorwayEverforestDarkSoftTheme = colorwayEverforestDarkSoftThemeJson as DesktopTheme
export const colorwayEvondevAuthorContrastTheme = colorwayEvondevAuthorContrastThemeJson as DesktopTheme
export const colorwayEvondevDraculaTheme = colorwayEvondevDraculaThemeJson as DesktopTheme
export const colorwayEvondevNewContrastTheme = colorwayEvondevNewContrastThemeJson as DesktopTheme
export const colorwayEvondevNightContrastTheme = colorwayEvondevNightContrastThemeJson as DesktopTheme
export const colorwayFairyflossTheme = colorwayFairyflossThemeJson as DesktopTheme
export const colorwayFireSpringTheme = colorwayFireSpringThemeJson as DesktopTheme
export const colorwayFireSpringDarkerTheme = colorwayFireSpringDarkerThemeJson as DesktopTheme
export const colorwayFluffyDarkTheme = colorwayFluffyDarkThemeJson as DesktopTheme
export const colorwayHatsuneMikuTheme = colorwayHatsuneMikuThemeJson as DesktopTheme
export const colorwayHydrangea11Theme = colorwayHydrangea11ThemeJson as DesktopTheme
export const colorwayInkCrimsonTheme = colorwayInkCrimsonThemeJson as DesktopTheme
export const colorwayKawaiiTheme = colorwayKawaiiThemeJson as DesktopTheme
export const colorwayKickDarkTheme = colorwayKickDarkThemeJson as DesktopTheme
export const colorwayLoFiGreenDarkTheme = colorwayLoFiGreenDarkThemeJson as DesktopTheme
export const colorwayMatchalkTheme = colorwayMatchalkThemeJson as DesktopTheme
export const colorwayMikuBetterTheme = colorwayMikuBetterThemeJson as DesktopTheme
export const colorwayModernPurpleTheme = colorwayModernPurpleThemeJson as DesktopTheme
export const colorwayMoonsideTheme = colorwayMoonsideThemeJson as DesktopTheme
export const colorwayNopal12Theme = colorwayNopal12ThemeJson as DesktopTheme
export const colorwayPastelPixelsTheme = colorwayPastelPixelsThemeJson as DesktopTheme
export const colorwayPinkGlazeMacaroonTheme = colorwayPinkGlazeMacaroonThemeJson as DesktopTheme
export const colorwayRosPineFoamTheme = colorwayRosPineFoamThemeJson as DesktopTheme
export const colorwayRosPineGoldTheme = colorwayRosPineGoldThemeJson as DesktopTheme
export const colorwayRosPineIrisTheme = colorwayRosPineIrisThemeJson as DesktopTheme
export const colorwayRosPineLoveTheme = colorwayRosPineLoveThemeJson as DesktopTheme
export const colorwayRosPinePineTheme = colorwayRosPinePineThemeJson as DesktopTheme
export const colorwayRosPineRoseTheme = colorwayRosPineRoseThemeJson as DesktopTheme
export const colorwayRosePineMoonFoamTheme = colorwayRosePineMoonFoamThemeJson as DesktopTheme
export const colorwayRosePineMoonGoldTheme = colorwayRosePineMoonGoldThemeJson as DesktopTheme
export const colorwayRosePineMoonIrisTheme = colorwayRosePineMoonIrisThemeJson as DesktopTheme
export const colorwayRosePineMoonLoveTheme = colorwayRosePineMoonLoveThemeJson as DesktopTheme
export const colorwayRosePineMoonPineTheme = colorwayRosePineMoonPineThemeJson as DesktopTheme
export const colorwayRosePineMoonRoseTheme = colorwayRosePineMoonRoseThemeJson as DesktopTheme
export const colorwaySailorMoonBackgroundTheme = colorwaySailorMoonBackgroundThemeJson as DesktopTheme
export const colorwaySeafoamTheme = colorwaySeafoamThemeJson as DesktopTheme
export const colorwaySlso8PixelsTheme = colorwaySlso8PixelsThemeJson as DesktopTheme
export const colorwaySoapy10Theme = colorwaySoapy10ThemeJson as DesktopTheme
export const colorwaySolarizedDarkTheme = colorwaySolarizedDarkThemeJson as DesktopTheme
export const colorwaySpiritedAwayTheme = colorwaySpiritedAwayThemeJson as DesktopTheme
export const colorwayTwitchDarkTheme = colorwayTwitchDarkThemeJson as DesktopTheme
export const colorwayYouTubeDarkTheme = colorwayYouTubeDarkThemeJson as DesktopTheme
export const colorwayZombieThreedTheme = colorwayZombieThreedThemeJson as DesktopTheme
export const colorwayZombieThreedDarkerTheme = colorwayZombieThreedDarkerThemeJson as DesktopTheme

export const DEFAULT_THEMES: Record<string, DesktopTheme> = {
  "oc-2": oc2Theme,
  amoled: amoledTheme,
  aura: auraTheme,
  ayu: ayuTheme,
  carbonfox: carbonfoxTheme,
  catppuccin: catppuccinTheme,
  "catppuccin-frappe": catppuccinFrappeTheme,
  "catppuccin-macchiato": catppuccinMacchiatoTheme,
  cobalt2: cobalt2Theme,
  cursor: cursorTheme,
  dracula: draculaTheme,
  everforest: everforestTheme,
  flexoki: flexokiTheme,
  github: githubTheme,
  gruvbox: gruvboxTheme,
  kanagawa: kanagawaTheme,
  "lucent-orng": lucentOrngTheme,
  material: materialTheme,
  matrix: matrixTheme,
  mercury: mercuryTheme,
  monokai: monokaiTheme,
  nightowl: nightowlTheme,
  nord: nordTheme,
  "one-dark": oneDarkTheme,
  onedarkpro: oneDarkProTheme,
  opencode: opencodeTheme,
  orng: orngTheme,
  "osaka-jade": osakaJadeTheme,
  palenight: palenightTheme,
  rosepine: rosepineTheme,
  shadesofpurple: shadesOfPurpleTheme,
  solarized: solarizedTheme,
  synthwave84: synthwave84Theme,
  tokyonight: tokyonightTheme,
  vercel: vercelTheme,
  vesper: vesperTheme,
  zenburn: zenburnTheme,
  "90s-anime": colorway90sAnimeTheme,
  "adapta-evergreen": colorwayAdaptaEvergreenTheme,
  "berry-nebula": colorwayBerryNebulaTheme,
  "catppuccin-frapp-blue": colorwayCatppuccinFrappBlueTheme,
  "catppuccin-frapp-green": colorwayCatppuccinFrappGreenTheme,
  "catppuccin-frapp-lavender": colorwayCatppuccinFrappLavenderTheme,
  "catppuccin-frapp-maroon": colorwayCatppuccinFrappMaroonTheme,
  "catppuccin-frapp-peach": colorwayCatppuccinFrappPeachTheme,
  "catppuccin-frapp-pink": colorwayCatppuccinFrappPinkTheme,
  "catppuccin-frapp-red": colorwayCatppuccinFrappRedTheme,
  "catppuccin-frapp-rosewater": colorwayCatppuccinFrappRosewaterTheme,
  "catppuccin-frapp-teal": colorwayCatppuccinFrappTealTheme,
  "catppuccin-frapp-yellow": colorwayCatppuccinFrappYellowTheme,
  "catppuccin-macchiato-blue": colorwayCatppuccinMacchiatoBlueTheme,
  "catppuccin-macchiato-green": colorwayCatppuccinMacchiatoGreenTheme,
  "catppuccin-macchiato-lavender": colorwayCatppuccinMacchiatoLavenderTheme,
  "catppuccin-macchiato-maroon": colorwayCatppuccinMacchiatoMaroonTheme,
  "catppuccin-macchiato-peach": colorwayCatppuccinMacchiatoPeachTheme,
  "catppuccin-macchiato-pink": colorwayCatppuccinMacchiatoPinkTheme,
  "catppuccin-macchiato-red": colorwayCatppuccinMacchiatoRedTheme,
  "catppuccin-macchiato-rosewater": colorwayCatppuccinMacchiatoRosewaterTheme,
  "catppuccin-macchiato-teal": colorwayCatppuccinMacchiatoTealTheme,
  "catppuccin-macchiato-yellow": colorwayCatppuccinMacchiatoYellowTheme,
  "catppuccin-mocha": colorwayCatppuccinMochaTheme,
  "catppuccin-mocha-blue": colorwayCatppuccinMochaBlueTheme,
  "catppuccin-mocha-green": colorwayCatppuccinMochaGreenTheme,
  "catppuccin-mocha-lavender": colorwayCatppuccinMochaLavenderTheme,
  "catppuccin-mocha-maroon": colorwayCatppuccinMochaMaroonTheme,
  "catppuccin-mocha-peach": colorwayCatppuccinMochaPeachTheme,
  "catppuccin-mocha-pink": colorwayCatppuccinMochaPinkTheme,
  "catppuccin-mocha-red": colorwayCatppuccinMochaRedTheme,
  "catppuccin-mocha-rosewater": colorwayCatppuccinMochaRosewaterTheme,
  "catppuccin-mocha-teal": colorwayCatppuccinMochaTealTheme,
  "catppuccin-mocha-yellow": colorwayCatppuccinMochaYellowTheme,
  "catppuccin-sibling-affogato": colorwayCatppuccinSiblingAffogatoTheme,
  "catppuccin-sibling-garnet": colorwayCatppuccinSiblingGarnetTheme,
  "catppuccin-sibling-lichen": colorwayCatppuccinSiblingLichenTheme,
  "catppuccin-sibling-matcha": colorwayCatppuccinSiblingMatchaTheme,
  "catppuccin-sibling-petal": colorwayCatppuccinSiblingPetalTheme,
  "catppuccin-sibling-sesame": colorwayCatppuccinSiblingSesameTheme,
  "catppuccin-sibling-terracotta": colorwayCatppuccinSiblingTerracottaTheme,
  "catppuccin-sibling-ube": colorwayCatppuccinSiblingUbeTheme,
  "claude-code": colorwayClaudeCodeTheme,
  "claude-code-warm": colorwayClaudeCodeWarmTheme,
  "claude-dark": colorwayClaudeDarkTheme,
  "cyclope6": colorwayCyclope6Theme,
  "dark-horizon": colorwayDarkHorizonTheme,
  "dark-magic": colorwayDarkMagicTheme,
  "dracula-refined": colorwayDraculaRefinedTheme,
  "dusty-dunes": colorwayDustyDunesTheme,
  "dusty-dunes-darker": colorwayDustyDunesDarkerTheme,
  "earthbound": colorwayEarthboundTheme,
  "earthbound-darker": colorwayEarthboundDarkerTheme,
  "ethereal-default": colorwayEtherealDefaultTheme,
  "ethereal-fallen-angel": colorwayEtherealFallenAngelTheme,
  "ethereal-frutiger": colorwayEtherealFrutigerTheme,
  "ethereal-gothic-angel": colorwayEtherealGothicAngelTheme,
  "ethereal-kerubin": colorwayEtherealKerubinTheme,
  "ethereal-luminous-space": colorwayEtherealLuminousSpaceTheme,
  "ethereal-windows-7": colorwayEtherealWindows7Theme,
  "ethereal-y2-k-aero": colorwayEtherealY2KAeroTheme,
  "everforest-dark-hard": colorwayEverforestDarkHardTheme,
  "everforest-dark-soft": colorwayEverforestDarkSoftTheme,
  "evondev-author-contrast": colorwayEvondevAuthorContrastTheme,
  "evondev-dracula": colorwayEvondevDraculaTheme,
  "evondev-new-contrast": colorwayEvondevNewContrastTheme,
  "evondev-night-contrast": colorwayEvondevNightContrastTheme,
  "fairyfloss": colorwayFairyflossTheme,
  "fire-spring": colorwayFireSpringTheme,
  "fire-spring-darker": colorwayFireSpringDarkerTheme,
  "fluffy-dark": colorwayFluffyDarkTheme,
  "hatsune-miku": colorwayHatsuneMikuTheme,
  "hydrangea-11": colorwayHydrangea11Theme,
  "ink-crimson": colorwayInkCrimsonTheme,
  "kawaii": colorwayKawaiiTheme,
  "kick-dark": colorwayKickDarkTheme,
  "lo-fi-green-dark": colorwayLoFiGreenDarkTheme,
  "matchalk": colorwayMatchalkTheme,
  "miku-better": colorwayMikuBetterTheme,
  "modern-purple": colorwayModernPurpleTheme,
  "moonside": colorwayMoonsideTheme,
  "nopal-12": colorwayNopal12Theme,
  "pastel-pixels": colorwayPastelPixelsTheme,
  "pink-glaze-macaroon": colorwayPinkGlazeMacaroonTheme,
  "ros-pine-foam": colorwayRosPineFoamTheme,
  "ros-pine-gold": colorwayRosPineGoldTheme,
  "ros-pine-iris": colorwayRosPineIrisTheme,
  "ros-pine-love": colorwayRosPineLoveTheme,
  "ros-pine-pine": colorwayRosPinePineTheme,
  "ros-pine-rose": colorwayRosPineRoseTheme,
  "rose-pine-moon-foam": colorwayRosePineMoonFoamTheme,
  "rose-pine-moon-gold": colorwayRosePineMoonGoldTheme,
  "rose-pine-moon-iris": colorwayRosePineMoonIrisTheme,
  "rose-pine-moon-love": colorwayRosePineMoonLoveTheme,
  "rose-pine-moon-pine": colorwayRosePineMoonPineTheme,
  "rose-pine-moon-rose": colorwayRosePineMoonRoseTheme,
  "sailor-moon-background": colorwaySailorMoonBackgroundTheme,
  "seafoam": colorwaySeafoamTheme,
  "slso8-pixels": colorwaySlso8PixelsTheme,
  "soapy-10": colorwaySoapy10Theme,
  "solarized-dark": colorwaySolarizedDarkTheme,
  "spirited-away": colorwaySpiritedAwayTheme,
  "twitch-dark": colorwayTwitchDarkTheme,
  "you-tube-dark": colorwayYouTubeDarkTheme,
  "zombie-threed": colorwayZombieThreedTheme,
  "zombie-threed-darker": colorwayZombieThreedDarkerTheme,
}
