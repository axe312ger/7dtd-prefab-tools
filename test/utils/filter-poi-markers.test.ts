import {expect} from '@oclif/test'
import chai from 'chai'
import {jestSnapshotPlugin} from 'mocha-chai-jest-snapshot'
import {readPrefabsFromXMLs} from '../../src/utils/read-prefabs'
import {filterPOIMarkers} from '../../src/utils/filter-poi-markers'
import {loadDecorations} from '../../src/utils/load-decorations'
import {initConfig} from '../../src/utils/config'
import {Prefab, PrefabToolsConfig} from '../../src/types'

chai.use(jestSnapshotPlugin())

describe('filter existing decoration list', () => {
  let config: PrefabToolsConfig
  let prefabs: {
    prefabsByName: Map<string, Prefab>;
    validPrefabsByName: Map<string, Prefab>;
  }
  before(async () => {
    config = await initConfig()
    prefabs = await readPrefabsFromXMLs(config)
  })
  it('filters out poi markers', async () => {
    const decorations = await loadDecorations(`
<prefabs>
  <decoration type="model" name="rwg_tile_commercial_intersection" position="-1476,35,-1602" rotation="3" />
  <decoration type="model" name="hotel_01" position="-1476,30,-1601" rotation="1" />
  <decoration type="model" name="remnant_business_02" position="-1476,30,-1513" rotation="1" />
  <decoration type="model" name="remnant_waste_01" position="-1382,34,-1591" rotation="2" />
  <decoration type="model" name="zztong_Office_Building_01_Destroyed" position="-1386,30,-1517" rotation="0" />
  <decoration type="model" name="part_car_accident_01" position="-1402,36,-1532" rotation="1" />
  <decoration type="model" name="rwg_tile_commercial_intersection" position="-1476,35,-1752" rotation="0" />
  <decoration type="model" name="store_book_01" position="-1387,36,-1752" rotation="2" />
  <decoration type="model" name="gas_station_09" position="-1475,35,-1752" rotation="2" />
  <decoration type="model" name="fire_station_01" position="-1379,31,-1658" rotation="3" />
  <decoration type="model" name="zztong_EMS_01" position="-1453,35,-1662" rotation="3" />
  <decoration type="model" name="part_ambulance_01" position="-1435,37,-1659" rotation="1" />
  <decoration type="model" name="part_shipping_container_06" position="-1424,37,-1660" rotation="1" />
  <decoration type="model" name="part_generator_01" position="-1433,37,-1650" rotation="1" />
  <decoration type="model" name="part_streetlight_single_diagonal" position="-1392,46,-1683" rotation="0" />
  <decoration type="model" name="part_trafficlight_single" position="-1399,43,-1664" rotation="2" />
</prefabs>
  `)
    const res = await filterPOIMarkers(decorations, prefabs.prefabsByName)
    expect(
      res.filter(({name}) => name.indexOf('rwg_tile_') === 0),
    ).to.have.length(2)
    expect(
      res.filter(({name}) => name.indexOf('rwg_tile_') !== 0),
    ).to.have.length(0)
    expect(res).to.matchSnapshot()
  })

  it('filters bug#1', async () => {
    const decorations = await loadDecorations(`
  <prefabs>
  <decoration type="model" name="rwg_tile_countrytown_cap_shopcenter" position="-1845,26,1295" rotation="1" />
  <decoration type="model" name="xcostum_Shops(by_Warsaken)" position="-1825,28,1315" rotation="1" />
  <decoration type="model" name="lot_industrial_05" position="-1728,35,1297" rotation="3" />
  <decoration type="model" name="xcostum_Supermarket_03(by_Zyncosa)" position="-1728,35,1380" rotation="1" />
  <decoration type="model" name="part_driveway_countrytown_09" position="-1730,36,1386" rotation="3" />
  <decoration type="model" name="xcostum_Billboard(by_OctoberFire)" position="-1728,34,1418" rotation="3" />
  <decoration type="model" name="part_driveway_countrytown_19" position="-1730,36,1423" rotation="3" />
  <decoration type="model" name="part_horde_large" position="-1719,37,1434" rotation="3" />
  </prefabs>
    `)
    const res = await filterPOIMarkers(decorations, prefabs.prefabsByName)
    expect(
      res.filter(({name}) => name.indexOf('rwg_tile_') === 0),
    ).to.have.length(1)
    expect(
      res.filter(({name}) => name.indexOf('rwg_tile_') !== 0),
    ).to.have.length(0)
    expect(res).to.matchSnapshot()
  })

  it('filters bug#2', async () => {
    const decorations = await loadDecorations(`
  <prefabs>
  <decoration type="model" name="rwg_tile_gateway_cap" position="-1695,34,1295" rotation="3" />
  <decoration type="model" name="trader_rekt" position="-1676,36,1382" rotation="0" />
  <decoration type="model" name="part_trader_tile_filler_01" position="-1695,35,1303" rotation="2" />
  <decoration type="model" name="xcostum_L4D_DT_Tower(by_CraterCreator)" position="422,45,-901" rotation="2" />
  <decoration type="model" name="part_horde_large" position="424,46,-897" rotation="3" />
  <decoration type="model" name="xcostum_Army_Bunker_01(by_Laz_Man)" position="-1190,27,3057" rotation="0" />
  <decoration type="model" name="gas_station_02" position="-198,35,2021" rotation="3" />
  <decoration type="model" name="xcostum_Burial_Shrine(by_Snake0567)" position="727,92,1440" rotation="1" />
  <decoration type="model" name="xcostum_The_Sphinx_3(by_Andyjoki)" position="777,-4,-2495" rotation="1" />
  <decoration type="model" name="part_loot_t5" position="814,19,-2396" rotation="3" />
  <decoration type="model" name="cabin_01" position="-24,36,-2789" rotation="3" />
  <decoration type="model" name="xcostum_Fire_Watch_Tower(by_SciFiFlippa)" position="239,66,-2018" rotation="0" />
  </prefabs>
    `)
    const res = await filterPOIMarkers(decorations, prefabs.prefabsByName)
    expect(
      res.filter(({name}) => name.indexOf('rwg_tile_') === 0),
    ).to.have.length(1, 'RWG tiles')
    expect(
      res.filter(({name}) => name.indexOf('part_') === 0),
    ).to.have.length(0, 'Parts')
    expect(
      res.filter(({name}) => name.indexOf('rwg_tile_') !== 0),
    ).to.have.length(7, 'Prefabs')
    expect(res).to.matchSnapshot()
  })

  it('can detect old west city', async () => {
    const decorations = await loadDecorations(`
<prefabs>
  <decoration type="model" name="rwg_tile_oldwest_corner" position="-1849,38,97" rotation="1" />
  <decoration type="model" name="oldwest_church" position="-1824,36,159" rotation="1" />
  <decoration type="model" name="oldwest_strip_01" position="-1774,35,143" rotation="2" />
  <decoration type="model" name="oldwest_strip_02" position="-1774,39,176" rotation="0" />
  <decoration type="model" name="oldwest_business_07" position="-1807,39,134" rotation="1" />
  <decoration type="model" name="oldwest_business_09" position="-1724,39,143" rotation="2" />
  <decoration type="model" name="oldwest_business_12" position="-1724,39,176" rotation="0" />
  <decoration type="model" name="oldwest_business_11" position="-1807,39,201" rotation="1" />
  <decoration type="model" name="oldwest_business_10" position="-1774,35,201" rotation="3" />
  <decoration type="model" name="rwg_tile_oldwest_cap" position="-1849,39,247" rotation="0" />
  <decoration type="model" name="oldwest_strip_03" position="-1770,39,247" rotation="3" />
  <decoration type="model" name="oldwest_strip_04" position="-1803,39,276" rotation="1" />
  <decoration type="model" name="remnant_oldwest_08" position="-1803,35,247" rotation="1" />
  <decoration type="model" name="oldwest_jail" position="-1803,39,332" rotation="1" />
  <decoration type="model" name="oldwest_business_04" position="-1786,39,367" rotation="0" />
  <decoration type="model" name="remnant_oldwest_05" position="-1770,39,314" rotation="3" />
  <decoration type="model" name="remnant_oldwest_07" position="-1770,39,339" rotation="3" />
  <decoration type="model" name="rwg_tile_gateway_cap" position="-1699,37,97" rotation="3" />
<decoration type="model" name="part_trader_tile_filler_03" position="-1699,38,105" rotation="2" />
</prefabs>
  `)
    const res = await filterPOIMarkers(decorations, prefabs.prefabsByName)
    // console.dir(res)
    expect(
      res.filter(({name}) => name.indexOf('rwg_tile_') === 0),
    ).to.have.length(3)
    expect(
      res.filter(({name}) => name.indexOf('rwg_tile_') !== 0),
    ).to.have.length(0)
    expect(res).to.matchSnapshot()
  })

  it('does not mess up custom placed prefabs', async () => {
    const decorations = await loadDecorations(`
<prefabs>
  <decoration type="model" name="xcostum_Watch_Tower_02(by_FLESHUS)" position="-3876,51,19" rotation="1" />
  <decoration type="model" name="xcostum_Watch_Tower_01(by_FLESHUS)" position="-2762,44,-10" rotation="3" />
  <decoration type="model" name="xcostum_Watch_Tower_02(by_FLESHUS)" position="-1795,25,-63" rotation="1" />
  <decoration type="model" name="xcostum_Watch_Tower_01(by_FLESHUS)" position="-1068,40,-35" rotation="2" />
  <decoration type="model" name="xcostum_Watch_Tower_01(by_FLESHUS)" position="-135,43,-14" rotation="3" />
</prefabs>
  `)
    const res = await filterPOIMarkers(decorations, prefabs.prefabsByName)
    expect(res).to.have.length(5)
  })

  it('tile that had issues', async () => {
    const decorations = await loadDecorations(`
<prefabs>  
  <decoration type="model" name="rwg_tile_rural_t" position="-2906,32,-1914" rotation="2" />
  <decoration type="model" name="lot_rural_filler_03" position="-2898,36,-1913" rotation="1" />
  <decoration type="model" name="house_old_ranch_01" position="-2898,36,-1825" rotation="1" />
  <decoration type="model" name="part_driveway_rural_02" position="-2838,36,-1786" rotation="1" />
  <decoration type="model" name="part_driveway_rural_02" position="-2838,36,-1805" rotation="1" />
  <decoration type="model" name="farm_04" position="-2824,35,-1913" rotation="3" />
  <decoration type="model" name="part_farm60_field_03" position="-2824,36,-1886" rotation="3" />
  <decoration type="model" name="part_driveway_rural_03" position="-2827,36,-1891" rotation="3" />
  <decoration type="model" name="part_driveway_rural_04" position="-2827,36,-1911" rotation="3" />
  <decoration type="model" name="xcostum_Survivor_House_A(by_Telric)" position="-2824,34,-1825" rotation="2" />
  <decoration type="model" name="part_driveway_rural_03" position="-2827,36,-1777" rotation="3" />
  <decoration type="model" name="part_xcostum_potato_27x18" position="-2784,36,-1822" rotation="1" />
  <decoration type="model" name="part_xcostum_goldenrod_27x18" position="-2803,36,-1822" rotation="1" />
  <decoration type="model" name="part_xcostum_coffee_27x18" position="-2823,36,-1822" rotation="1" />
  <decoration type="model" name="part_roadside_fruit_stand_01" position="-2825,37,-1852" rotation="3" />
</prefabs>
  `)
    const res = await filterPOIMarkers(decorations, prefabs.prefabsByName)
    expect(
      res.filter(({name}) => name.indexOf('rwg_tile_') === 0),
    ).to.have.length(1, 'RWG tiles')
    expect(
      res.filter(({name}) => name.indexOf('part_') === 0),
    ).to.have.length(0, 'Parts')
    expect(
      res.filter(({name}) => name.indexOf('rwg_tile_') !== 0),
    ).to.have.length(0, 'Prefabs')
    expect(res).to.matchSnapshot()
  })

  it('tile2 that had issues', async () => {
    const decorations = await loadDecorations(`
<prefabs>  
  <decoration type="model" name="rwg_tile_commercial_intersection_ghost" position="-1476,25,-1602" rotation="3" />
  <decoration type="model" name="xcostum_Ghost_Buster(by_Pashmina)" position="-1432,35,-1558" rotation="1" />
  <decoration type="model" name="xcostum_Commercial_Espresso_Yourself(by_AndyRed)" position="-1354,35,-1560" rotation="3" />
  <decoration type="model" name="part_driveway_countrytown_20" position="-1353,36,-1535" rotation="2" />
  <decoration type="model" name="xcostum_Frat_House(by_EvilRacc0on)" position="-1354,36,-1585" rotation="3" />
  <decoration type="model" name="xcostum_Book_Store(by_Pashmina)" position="-1393,35,-1599" rotation="2" />
  <decoration type="model" name="xcostum_Commercial_Quad(By_Zeebark)" position="-1434,35,-1601" rotation="2" />
  <decoration type="model" name="xcostum_Commercial_Zee_Bliss(by_Zeebark)" position="-1459,35,-1601" rotation="1" />
  <decoration type="model" name="xcostum_Pass_Gas_Store(by_Pashmina)" position="-1475,35,-1575" rotation="1" />
  <decoration type="model" name="xcostum_Commercial_Tattooist(by_Mute)" position="-1434,36,-1480" rotation="0" />
  <decoration type="model" name="part_horde_large" position="-1422,37,-1470" rotation="0" />
  <decoration type="model" name="xcostum_Commercial_Kits_Gelato(by_Shema)" position="-1393,36,-1480" rotation="3" />
  <decoration type="model" name="xcostum_Commercial_Bakery(by_Shema)" position="-1368,36,-1480" rotation="2" />
  <decoration type="model" name="xcostum_Commercial_Fit_You(by_Shema)" position="-1352,36,-1519" rotation="0" />
  <decoration type="model" name="xcostum_Open_Food_Court(by_Pashmina)" position="-1473,35,-1519" rotation="3" />
  <decoration type="model" name="xcostum_Commercial_Valentine_Gift_Shop(by_Libby)" position="-1459,35,-1480" rotation="0" />
  <decoration type="model" name="part_bus_stop_02" position="-1358,37,-1519" rotation="0" />
  <decoration type="model" name="part_coffee_stand" position="-1465,37,-1492" rotation="2" />
  <decoration type="model" name="part_coffee_stand" position="-1367,37,-1601" rotation="2" />
  <decoration type="model" name="part_kiosk_foodtrailer_01" position="-1355,37,-1601" rotation="2" />
  <decoration type="model" name="part_kiosk_sign_03" position="-1435,37,-1574" rotation="1" />
  <decoration type="model" name="part_kiosk_sign_06" position="-1448,37,-1488" rotation="2" />
</prefabs>
  `)
    const res = await filterPOIMarkers(decorations, prefabs.prefabsByName)
    expect(
      res.filter(({name}) => name.indexOf('rwg_tile_') === 0),
    ).to.have.length(1, 'RWG tiles')
    expect(
      res.filter(({name}) => name.indexOf('part_') === 0),
    ).to.have.length(0, 'Parts')
    expect(
      res.filter(({name}) => name.indexOf('rwg_tile_') !== 0),
    ).to.have.length(0, 'Prefabs')
  })

  it('tile3 that had issues', async () => {
    const decorations = await loadDecorations(`
<prefabs>  
  <decoration type="model" name="rwg_tile_downtown_straight_afp" position="-1626,26,-1902" rotation="0" />
  <decoration type="model" name="xcostum_AFP(by_Stallionsden)" position="-1596,26,-1867" rotation="0" />
  <decoration type="model" name="part_car_accident_01" position="-1555,36,-1767" rotation="0" />
  <decoration type="model" name="part_coffee_stand" position="-1565,37,-1765" rotation="3" />
  <decoration type="model" name="part_coffee_stand" position="-1595,37,-1765" rotation="1" />
  <decoration type="model" name="part_bus_stop_02" position="-1565,37,-1898" rotation="3" />
  <decoration type="model" name="part_bus_stop_03" position="-1577,37,-1898" rotation="3" />
  <decoration type="model" name="part_bus_stop_04" position="-1589,37,-1898" rotation="0" />
  <decoration type="model" name="part_bus_stop_04" position="-1547,37,-1898" rotation="0" />
  <decoration type="model" name="part_bus_stop_02" position="-1534,37,-1898" rotation="3" />
  <decoration type="model" name="part_bus_stop_03" position="-1522,37,-1898" rotation="3" />
  <decoration type="model" name="part_downtown_road_construction" position="-1501,28,-1828" rotation="2" />
  <decoration type="model" name="part_kiosk_01" position="-1544,37,-1772" rotation="2" />
  <decoration type="model" name="part_kiosk_02" position="-1535,37,-1772" rotation="2" />
  <decoration type="model" name="part_kiosk_01" position="-1544,37,-1759" rotation="0" />
  <decoration type="model" name="part_kiosk_02" position="-1535,37,-1759" rotation="0" />
  <decoration type="model" name="part_kiosk_01" position="-1517,37,-1774" rotation="3" />
  <decoration type="model" name="part_kiosk_02" position="-1517,37,-1766" rotation="3" />
</prefabs>
  `)
    const res = await filterPOIMarkers(decorations, prefabs.prefabsByName)
    expect(
      res.filter(({name}) => name.indexOf('rwg_tile_') === 0),
    ).to.have.length(1, 'RWG tiles')
    expect(
      res.filter(({name}) => name.indexOf('part_') === 0),
    ).to.have.length(0, 'Parts')
    expect(
      res.filter(({name}) => name.indexOf('rwg_tile_') !== 0),
    ).to.have.length(0, 'Prefabs')
  })

  it('tile4 that had issues', async () => {
    const decorations = await loadDecorations(`
<prefabs>  
  <decoration type="model" name="rwg_tile_rural_straight" position="-561,33,-3288" rotation="0" />
  <decoration type="model" name="xcostum_Homestead(by_Mana)" position="-511,8,-3274" rotation="3" />
  <decoration type="model" name="part_driveway_rural_07" position="-514,36,-3228" rotation="3" />
</prefabs>
  `)
    const res = await filterPOIMarkers(decorations, prefabs.prefabsByName)
    expect(
      res.filter(({name}) => name.indexOf('rwg_tile_') === 0),
    ).to.have.length(1, 'RWG tiles')
    expect(
      res.filter(({name}) => name.indexOf('part_') === 0),
    ).to.have.length(0, 'Parts')
    expect(
      res.filter(({name}) => name.indexOf('rwg_tile_') !== 0),
    ).to.have.length(0, 'Prefabs')
  })

  it('zipcore1', async () => {
    const decorations = await loadDecorations(`
<prefabs>  
    <decoration type="model" name="rwg_tile_commercial_intersection" position="509,59,519" rotation="1" />
  <decoration type="model" name="remnant_business_02" position="599,54,608" rotation="3" />
  <decoration type="model" name="remnant_waste_16" position="599,55,520" rotation="3" />
  <decoration type="model" name="remnant_waste_03" position="523,59,616" rotation="0" />
  <decoration type="model" name="fastfood_04" position="527,60,542" rotation="0" />
  <decoration type="model" name="part_kiosk_foodtrailer_01" position="532,61,520" rotation="2" />
  <decoration type="model" name="part_streetlight_single_diagonal" position="589,70,603" rotation="1" />
</prefabs>
  `)
    const res = await filterPOIMarkers(decorations, prefabs.prefabsByName)
    // expect(res).to.have.length(2)
    // console.dir(res)
    expect(
      res.filter(({name}) => name.indexOf('rwg_tile_') === 0),
    ).to.have.length(1, 'RWG tiles')
    expect(
      res.filter(({name}) => name.indexOf('part_') === 0),
    ).to.have.length(0, 'Parts')
    expect(
      res.filter(({name}) => name.indexOf('rwg_tile_') !== 0),
    ).to.have.length(0, 'Prefabs')
    expect(res).to.matchSnapshot()
  })
})
