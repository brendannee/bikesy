import Head from 'next/head';

const Api = () => (
  <div>
    <Head>
      <title>Bikesy API</title>
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
        key="viewport"
      />
      <meta
        name="description"
        content="Avoid hills and find bike routes with Bikesy.com, an innovative and open-source bike mapping system specially designed to find flat, safe, and fast bike routes anywhere in the San Francisco Bay Area. San Francisco isn’t New York – they might have taller buildings, but we’ve got bigger hills. Since we couldn’t find another service that lets you choose slightly longer but less steep routes, we made our own. Even better, Bikesy automatically gives you an elevation profile for your ride to help you prepare for the tough parts."
      />

      <link
        rel="stylesheet"
        href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css"
        integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh"
        crossOrigin="anonymous"
      />
      <link rel="stylesheet" type="text/css" href="css/style.css" />

      <link rel="apple-touch-icon" sizes="180x180" href="favicon/apple-touch-icon.png" />
      <link rel="icon" type="image/png" href="favicon/favicon-32x32.png" sizes="32x32" />
      <link rel="icon" type="image/png" href="favicon/favicon-16x16.png" sizes="16x16" />
      <link rel="mask-icon" href="favicon/safari-pinned-tab.svg" color="#5bbad5" />
      <meta name="theme-color" content="#ffffff" />
    </Head>

    <div className="container">
      <h2>About Bikesy</h2>

      <p>Bikesy’s bike routes are available via an API. </p>
      <p>Example</p>
      <div>
        <pre>
          <code>
            https://api.bikesy.com?lat1=37.7910183&amp;lng1=-122.3991499&amp;lat2=37.7700099&amp;lng2=-122.44693656&amp;scenario=3
          </code>
        </pre>
      </div>

      <p>
        This example returns JSON for a bike route from the Financial district in San
        Francisco to Haight and Ashbury.
      </p>
      <h3>API Input</h3>
      <table className="table table-striped table-hover">
        <thead>
          <tr>
            <td>Input</td>
            <td style={{ width: '250px' }}>Description</td>
            <td>Format</td>
            <td style={{ width: '150px' }}>Example</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>lat1</td>
            <td>Latitude of starting point</td>
            <td>Numeric</td>
            <td>37.7910</td>
          </tr>
          <tr>
            <td>lng1</td>
            <td>Longitude of starting point</td>
            <td>Numeric</td>
            <td>-122.3991</td>
          </tr>
          <tr>
            <td>lat2</td>
            <td>Latitude of ending point</td>
            <td>Numeric</td>
            <td>37.7700</td>
          </tr>
          <tr>
            <td>lng2</td>
            <td>Longitude of ending point</td>
            <td>Numeric</td>
            <td>-122.4469</td>
          </tr>
          <tr>
            <td>scenario</td>
            <td>Route Scenario</td>
            <td>String</td>
            <td>1-9</td>
          </tr>
        </tbody>
      </table>

      <p>Example Input</p>
      <div>
        <pre>
          <code>
            <a href="https://bikesy.com/api/route?lat1=37.79099655151367&lng1=-122.39909362792969&lat2=37.78794572301525&lng2=-122.40700721740723&scenario=3">
              https://bikesy.com/api/route?lat1=37.79099655151367&amp;lng1=-122.39909362792969&amp;lat2=37.78794572301525&amp;lng2=-122.40700721740723&amp;scenario=3
            </a>
          </code>
        </pre>
      </div>
      <p>Example Output</p>
      <div>
        <pre>
          <code>
            {`{
  directions: [
    [
      "start northwest",
      "1st Street",
      [
        -122.39904022216797,
        37.79095458984375
      ]
    ],
    [
      "left",
      "Market Street",
      [
        -122.39916229248047,
        37.79104995727539
      ]
    ],
    [
      "right",
      "Sutter Street",
      [
        -122.40009307861328,
        37.790313720703125
      ]
    ],
    [
      "left",
      "Stockton Street",
      [
        -122.406982421875,
        37.78943634033203
      ]
    ],
    [
      "right",
      "nameless",
      [
        -122.40679168701172,
        37.78850173950195
      ]
    ],
    [
      "left",
      "nameless",
      [
        -122.40711975097656,
        37.788211822509766
      ]
    ]
  ],
  path: [
    "m\`teF~\`ajVQVpCxDnD\`j@xDe@v@p@@Ln@G",
    "B?@@???B"
  ],
  stats: {
    route_desc_time: 0.07801294326782227,
    route_find_time: 0.026762962341308594,
    endpoint_find_time: 0.03102397918701172
  },
  total_distance: 227.82277810367316,
  elevation_profile: [
    [
      0,
      5.0752482414245605
    ],
    [
      7.544057846069336,
      5.091028213500977
    ],
    [
      15.088115692138672,
      5.083014011383057
    ],
    [
      15.088115692138672,
      5.083014011383057
    ],
    [
      24.6302490234375,
      5.095391273498535
    ],
    [
      34.17238235473633,
      5.0944414138793945
    ],
    [
      34.17238235473633,
      5.0944414138793945
    ],
    [
      42.17867660522461,
      5.131943225860596
    ],
    [
      50.18497085571289,
      5.274590969085693
    ],
    [
      58.19126510620117,
      5.385646343231201
    ],
    [
      66.19755554199219,
      5.406042575836182
    ],
    [
      66.19755554199219,
      5.406042575836182
    ],
    [
      75.31005859375,
      5.507899284362793
    ],
    [
      84.42256164550781,
      5.7164459228515625
    ],
    [
      93.53506469726562,
      5.901495456695557
    ],
    [
      102.64756774902344,
      6.0424957275390625
    ],
    [
      111.76007080078125,
      6.195816516876221
    ],
    [
      111.76007080078125,
      6.195816516876221
    ],
    [
      121.30224323272705,
      6.379543304443359
    ],
    [
      130.84441566467285,
      6.591588020324707
    ],
    [
      130.84441566467285,
      6.591588020324707
    ],
    [
      134.96445083618164,
      6.704606056213379
    ],
    [
      142.76474380493164,
      6.9077301025390625
    ],
    [
      150.5650405883789,
      7.064327239990234
    ],
    [
      150.5650405883789,
      7.064327239990234
    ],
    [
      157.7345848083496,
      7.1707024574279785
    ],
    [
      164.90413284301758,
      7.313899517059326
    ],
    [
      164.90413284301758,
      7.313899517059326
    ],
    [
      170.0148696899414,
      7.466989994049072
    ],
    [
      175.12560272216797,
      7.61562442779541
    ],
    [
      175.12560272216797,
      7.61562442779541
    ],
    [
      179.8487091064453,
      7.760673999786377
    ],
    [
      179.8487091064453,
      7.760673999786377
    ],
    [
      189.2423858642578,
      8.054417610168457
    ],
    [
      198.63607025146484,
      8.314105987548828
    ],
    [
      208.02974700927734,
      8.528959274291992
    ],
    [
      217.42343139648438,
      8.689697265625
    ],
    [
      226.81710815429688,
      8.872651100158691
    ],
    [
      236.21078491210938,
      9.167342185974121
    ],
    [
      245.60446166992188,
      9.378177642822266
    ],
    [
      254.99813842773438,
      9.502896308898926
    ],
    [
      264.3918151855469,
      9.701557159423828
    ],
    [
      273.78550720214844,
      9.916430473327637
    ],
    [
      283.17918395996094,
      10.009174346923828
    ],
    [
      292.57286071777344,
      10.230462074279785
    ],
    [
      301.966552734375,
      10.52198314666748
    ],
    [
      311.3602294921875,
      10.807267189025879
    ],
    [
      320.75390625,
      10.992822647094727
    ],
    [
      320.75390625,
      10.992822647094727
    ],
    [
      330.5104217529297,
      11.14419174194336
    ],
    [
      340.2669372558594,
      11.35804271697998
    ],
    [
      350.0234680175781,
      11.658734321594238
    ],
    [
      350.0234680175781,
      11.658734321594238
    ],
    [
      358.59857177734375,
      11.915679931640625
    ],
    [
      367.1736755371094,
      12.171150207519531
    ],
    [
      375.748779296875,
      12.43166732788086
    ],
    [
      384.3238830566406,
      12.690914154052734
    ],
    [
      392.89898681640625,
      12.948080062866211
    ],
    [
      392.89898681640625,
      12.948080062866211
    ],
    [
      402.2572937011719,
      13.229154586791992
    ],
    [
      411.6155700683594,
      13.510175704956055
    ],
    [
      420.973876953125,
      13.792105674743652
    ],
    [
      430.3321838378906,
      14.073530197143555
    ],
    [
      439.6904602050781,
      14.356657028198242
    ],
    [
      449.04876708984375,
      14.58889389038086
    ],
    [
      458.4070739746094,
      14.701386451721191
    ],
    [
      467.7653503417969,
      14.887154579162598
    ],
    [
      467.7653503417969,
      14.887154579162598
    ],
    [
      475.9289855957031,
      15.12700366973877
    ],
    [
      484.09259033203125,
      15.385390281677246
    ],
    [
      492.2562255859375,
      15.661421775817871
    ],
    [
      500.4198303222656,
      16.04209327697754
    ],
    [
      500.4198303222656,
      16.04209327697754
    ],
    [
      510.1341552734375,
      16.508846282958984
    ],
    [
      519.8484497070312,
      16.982973098754883
    ],
    [
      529.5627746582031,
      17.358182907104492
    ],
    [
      539.2770690917969,
      17.653135299682617
    ],
    [
      548.9913940429688,
      18.020797729492188
    ],
    [
      558.7056884765625,
      18.468069076538086
    ],
    [
      568.4200134277344,
      18.848094940185547
    ],
    [
      578.1343078613281,
      19.275659561157227
    ],
    [
      587.8486328125,
      19.72952651977539
    ],
    [
      597.5629272460938,
      20.26630973815918
    ],
    [
      607.2772521972656,
      20.60575294494629
    ],
    [
      607.2772521972656,
      20.60575294494629
    ],
    [
      615.673228263855,
      20.84258270263672
    ],
    [
      624.0692043304443,
      21.232343673706055
    ],
    [
      632.4651794433594,
      21.679885864257812
    ],
    [
      640.861156463623,
      22.09402847290039
    ],
    [
      649.2571296691895,
      22.46666145324707
    ],
    [
      657.6531066894531,
      22.797697067260742
    ],
    [
      657.6531066894531,
      22.797697067260742
    ],
    [
      667.4096908569336,
      23.258392333984375
    ],
    [
      677.1662750244141,
      23.61315155029297
    ],
    [
      686.9228668212891,
      24.133377075195312
    ],
    [
      696.6794509887695,
      24.848003387451172
    ],
    [
      706.43603515625,
      25.44043731689453
    ],
    [
      716.192626953125,
      25.908044815063477
    ],
    [
      725.9492111206055,
      26.290786743164062
    ],
    [
      735.7057952880859,
      26.706878662109375
    ],
    [
      745.4623718261719,
      27.239797592163086
    ],
    [
      745.4623718261719,
      27.239797592163086
    ],
    [
      754.0364379882812,
      26.89752197265625
    ],
    [
      763.3006591796875,
      26.48716926574707
    ],
    [
      772.5648956298828,
      26.142183303833008
    ],
    [
      781.8291320800781,
      25.74917984008789
    ],
    [
      791.0933532714844,
      25.289548873901367
    ],
    [
      800.3575897216797,
      24.87709617614746
    ],
    [
      800.3575897216797,
      24.87709617614746
    ],
    [
      808.096435546875,
      24.598548889160156
    ],
    [
      815.8352966308594,
      24.230863571166992
    ],
    [
      815.8352966308594,
      24.230863571166992
    ],
    [
      824.5487670898438,
      23.7544002532959
    ],
    [
      833.2622375488281,
      23.327404022216797
    ],
    [
      841.9757232666016,
      22.932119369506836
    ],
    [
      850.5497741699219,
      22.596555709838867
    ],
    [
      850.5497741699219,
      22.596555709838867
    ],
    [
      857.372899055481,
      22.53114128112793
    ],
    [
      864.19602394104,
      22.529682159423828
    ],
    [
      871.0191497802734,
      22.59964942932129
    ],
    [
      879.8062362670898,
      22.91325569152832
    ],
    [
      888.5933227539062,
      23.306537628173828
    ],
    [
      895.4326210021973,
      23.563129425048828
    ],
    [
      895.4326210021973,
      23.563129425048828
    ],
    [
      904.1460952758789,
      23.758033752441406
    ],
    [
      912.8595695495605,
      23.80368423461914
    ],
    [
      921.5730438232422,
      23.817644119262695
    ]
  ]
}`}
          </code>
        </pre>
      </div>

      <h2>API Details</h2>
      <p>
        We made assumptions about weighting different{' '}
        <a href="http://wiki.openstreetmap.org/wiki/Highway_tag_usage">
          OpenStreetMaps road classifications
        </a>{' '}
        for each scenario. For all scenarios, busier road classifications such as
        “motorway” and “primary” were given a higher weight than less busy road
        classifications such as “tertiary” and “path”. Weights are multipliers on the
        actual length of the link so a higher weight on a segment of road means that we
        are more likely to avoid routing on that segment.
      </p>
      <p>The weights used by bikesy for each scenario are shown below:</p>
      <table className="table table-striped table-hover">
        <thead>
          <tr height="20">
            <td width="254" height="20">
              Type
            </td>
            <td width="195">Example</td>
            <td width="88">Low</td>
            <td width="63">Medium</td>
            <td width="105">High</td>
          </tr>
        </thead>
        <tbody>
          <tr height="20">
            <td height="20">Highway:Motorway/Motorway Link</td>
            <td>Bay Bridge, I-101</td>
            <td align="right">100</td>
            <td align="right">100</td>
            <td align="right">100</td>
          </tr>
          <tr height="20">
            <td height="20">Highway:Trunk/Trunk Link</td>
            <td>19th Ave, Lombard to I-101</td>
            <td align="right">1.2</td>
            <td align="right">1.35</td>
            <td align="right">1.5</td>
          </tr>
          <tr height="20">
            <td height="20">Highway:Primary/Primary Link</td>
            <td>Geary, Cesar Chavez</td>
            <td align="right">1.1</td>
            <td align="right">1.25</td>
            <td align="right">1.4</td>
          </tr>
          <tr height="20">
            <td height="20">Highway:Secondary/Secondary Link</td>
            <td>Potrero, 3rd St</td>
            <td align="right">1</td>
            <td align="right">1.1</td>
            <td align="right">1.2</td>
          </tr>
          <tr height="20">
            <td height="20">Highway:Residential</td>
            <td>Shotwell</td>
            <td align="right">1</td>
            <td align="right">0.95</td>
            <td align="right">0.9</td>
          </tr>
          <tr height="20">
            <td height="20">Highway:Living Street</td>
            <td>*not in SF</td>
            <td align="right">1</td>
            <td align="right">0.95</td>
            <td align="right">0.9</td>
          </tr>
          <tr height="20">
            <td height="20">Highway:Steps</td>
            <td>any steps</td>
            <td align="right">2</td>
            <td align="right">2</td>
            <td align="right">2</td>
          </tr>
          <tr height="20">
            <td height="20">Highway:Track</td>
            <td>Wawona St (usually dirt track)</td>
            <td align="right">1.1</td>
            <td align="right">1.05</td>
            <td align="right">1</td>
          </tr>
          <tr height="20">
            <td height="20">Highway:Pedestrian</td>
            <td>Civic Center Plaza</td>
            <td align="right">1.1</td>
            <td align="right">1.1</td>
            <td align="right">1.1</td>
          </tr>
          <tr height="20">
            <td height="20">Highway:Path</td>
            <td>Usually dirt path</td>
            <td align="right">1.1</td>
            <td align="right">1.05</td>
            <td align="right">1</td>
          </tr>
          <tr height="20">
            <td height="20">Highway:Cycleway</td>
            <td>Octavia Blvd</td>
            <td align="right">0.9</td>
            <td align="right">0.8</td>
            <td align="right">0.7</td>
          </tr>
          <tr height="20">
            <td height="20">Cycleway:Lane</td>
            <td>Valencia</td>
            <td align="right">0.9</td>
            <td align="right">0.8</td>
            <td align="right">0.7</td>
          </tr>
          <tr height="20">
            <td height="20">Cycleway:Track</td>
            <td>Octavia Blvd</td>
            <td align="right">0.9</td>
            <td align="right">0.8</td>
            <td align="right">0.7</td>
          </tr>
          <tr height="20">
            <td height="20">Cycleway:Path</td>
            <td>Golden Gate Bridge</td>
            <td align="right">0.9</td>
            <td align="right">0.8</td>
            <td align="right">0.7</td>
          </tr>
          <tr height="20">
            <td height="20">Bicycle:Designated</td>
            <td>Ocean Ave (along beach)</td>
            <td align="right">0.9</td>
            <td align="right">0.8</td>
            <td align="right">0.7</td>
          </tr>
          <tr height="20">
            <td height="20">Bicycle:Yes</td>
            <td>El Camino Del Mar</td>
            <td align="right">0.9</td>
            <td align="right">0.8</td>
            <td align="right">0.7</td>
          </tr>
          <tr height="20">
            <td height="20">Route:Bicycle</td>
            <td></td>
            <td align="right">0.9</td>
            <td align="right">0.8</td>
            <td align="right">0.7</td>
          </tr>
        </tbody>
      </table>

      <h2>Contact Us</h2>
      <p>
        Let us know how you use the API, send us suggestions for improving it or ask us a
        question about our less-than-complete documentation.{' '}
        <a href="mailto:info@bikesy.com">info@bikesy.com</a>. Want to contribute? Fork our
        <a href="http://github.com/brendannee/bikesy">front end</a> or{' '}
        <a href="https://github.com/brendannee/bikesy-server">back end</a> and get going.
      </p>
    </div>
  </div>
);

export default Api;
