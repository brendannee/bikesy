import Head from 'next/head.js'

const Api = () => (
  <div>
    <Head>
      <title>Bikesy API</title>
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" key="viewport" />
      <meta name="description" content="Avoid hills and find bike routes with Bikesy.com, an innovative and open-source bike mapping system specially designed to find flat, safe, and fast bike routes anywhere in the San Francisco Bay Area. San Francisco isn’t New York – they might have taller buildings, but we’ve got bigger hills. Since we couldn’t find another service that lets you choose slightly longer but less steep routes, we made our own. Even better, Bikesy automatically gives you an elevation profile for your ride to help you prepare for the tough parts." />

      <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossOrigin="anonymous" />
      <link rel="stylesheet" type="text/css" href="css/style.css" />

      <link rel="apple-touch-icon" sizes="180x180" href="favicon/apple-touch-icon.png" />
      <link rel="icon" type="image/png" href="favicon/favicon-32x32.png" sizes="32x32" />
      <link rel="icon" type="image/png" href="favicon/favicon-16x16.png" sizes="16x16" />
      <link rel="mask-icon" href="favicon/safari-pinned-tab.svg" color="#5bbad5" />
      <meta name="theme-color" content="#ffffff" />
    </Head>

    <div className="container">
      <h2>About Bikesy</h2>

      <p>Bikesy’s bike routes are available via an API.</p>
      <p>Example</p>
      <div>
        <pre><code>https://api.bikesy.com/route?lat1=37.7910183&amp;lng1=-122.3991499&amp;lat2=37.7700099&amp;lng2=-122.44693656&amp;hills=low&amp;safety=high</code></pre>
      </div>

      <ul>
        <li>hills<br />low = low tolerance, will avoid slopes.<br />high = high tolerance, will take standard route.</li>
        <li>safety<br />low = low safety, will consider most roads.<br />high = high safety, will prefer bike lanes and non-primary roads.</li>
      </ul>

      <p>This example returns JSON for a bike route from the Financial district in San Francisco to Haight and Ashbury.</p>
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
            <td>hills</td>
            <td>Hill Scenario</td>
            <td>String</td>
            <td>low|med|hight</td>
          </tr>
          <tr>
            <td>safety</td>
            <td>Safety Scenario</td>
            <td>String</td>
            <td>low|med|hight</td>
          </tr>
        </tbody>
      </table>

      <p>Example Input</p>
      <div>
        <pre><code><a href="https://api.bikesy.com/route?lat1=37.79099655151367&lng1=-122.39909362792969&lat2=37.78794572301525&lng2=-122.40700721740723&hills=low&safety=high">https://api.bikesy.com/route?lat1=37.79099655151367&amp;lng1=-122.39909362792969&amp;lat2=37.78794572301525&amp;lng2=-122.40700721740723&amp;hills=low&amp;safety=high</a></code></pre>
      </div>
      <p>Example Output</p>
      <div>
        <pre><code>
          {`{
   "geometry":"w\`teFjaajVGHA@V^HJ\`@j@nAbBd@n@JN\`@j@dB~BDFLNLRx@fARXTZHL\\b@FJJRf@bAd@l@Fn@@\\BTDr@\\lFb@nG@R@LBT?DF\`ABZ@ZUBYDGmAc@F",
   "elevation_profile":[
      {
         "elevation":4.74,
         "distance":0
      },
      {
         "elevation":4.8,
         "distance":6.676554
      },
      {
         "elevation":4.8,
         "distance":8.552661
      },
      {
         "elevation":5,
         "distance":27.65733
      },
      {
         "elevation":5.22,
         "distance":35.70838
      },
      {
         "elevation":5.63,
         "distance":62.051067
      },
      {
         "elevation":6.77,
         "distance":124.72908
      },
      {
         "elevation":7.16,
         "distance":154.63527
      },
      {
         "elevation":7.36,
         "distance":165.00275
      },
      {
         "elevation":7.86,
         "distance":191.5952
      },
      {
         "elevation":9.28,
         "distance":271.8573
      },
      {
         "elevation":9.39,
         "distance":276.5786
      },
      {
         "elevation":9.52,
         "distance":286.44376
      },
      {
         "elevation":9.62,
         "distance":298.73163
      },
      {
         "elevation":10.35,
         "distance":344.27173
      },
      {
         "elevation":10.53,
         "distance":359.7653
      },
      {
         "elevation":10.71,
         "distance":377.33777
      },
      {
         "elevation":10.92,
         "distance":385.43787
      },
      {
         "elevation":11.41,
         "distance":407.88983
      },
      {
         "elevation":11.56,
         "distance":414.7173
      },
      {
         "elevation":11.8,
         "distance":426.1659
      },
      {
         "elevation":12.65,
         "distance":463.34235
      },
      {
         "elevation":13.27,
         "distance":493.31693
      },
      {
         "elevation":14,
         "distance":514.346
      },
      {
         "elevation":14.1,
         "distance":527.52576
      },
      {
         "elevation":14.05,
         "distance":537.57983
      },
      {
         "elevation":14.35,
         "distance":560.36206
      },
      {
         "elevation":15.75,
         "distance":666.3726
      },
      {
         "elevation":18.62,
         "distance":787.7558
      },
      {
         "elevation":18.7,
         "distance":796.68274
      },
      {
         "elevation":18.77,
         "distance":802.9167
      },
      {
         "elevation":18.87,
         "distance":812.6933
      },
      {
         "elevation":18.87,
         "distance":815.08997
      },
      {
         "elevation":19.27,
         "distance":844.88776
      },
      {
         "elevation":19.5,
         "distance":857.599
      },
      {
         "elevation":19.84,
         "distance":869.78894
      },
      {
         "elevation":19.74,
         "distance":882.9327
      },
      {
         "elevation":21.68,
         "distance":896.87213
      },
      {
         "elevation":21.01,
         "distance":930.78516
      },
      {
         "elevation":23.69,
         "distance":950.8488
      }
   ],
   "steps":[
      {
         "intersections":[
            {
               "out":0,
               "int":0,
               "entry":[
                  true
               ],
               "bearings":[
                  316
               ],
               "location":[
                  -122.39909,
                  37.790997
               ]
            }
         ],
         "driving_side":"right",
         "geometry":"w\`teFjaajVGHA@",
         "mode":"pushing bike",
         "duration":18.2,
         "maneuver":{
            "bearing_after":316,
            "type":"depart",
            "modifier":"",
            "bearing_before":0,
            "location":[
               -122.39909,
               37.790997
            ]
         },
         "weight":18.2,
         "distance":8.6,
         "name":"1st Street",
         "pronunciation":""
      },
      {
         "intersections":[
            {
               "out":4,
               "int":0,
               "entry":[
                  true,
                  true,
                  false,
                  true,
                  true,
                  true,
                  true
               ],
               "bearings":[
                  15,
                  45,
                  135,
                  210,
                  225,
                  285,
                  315
               ],
               "location":[
                  -122.39916,
                  37.79105
               ]
            },
            {
               "out":2,
               "int":0,
               "entry":[
                  false,
                  true,
                  true,
                  true
               ],
               "bearings":[
                  45,
                  75,
                  225,
                  255
               ],
               "location":[
                  -122.4001,
                  37.790314
               ]
            }
         ],
         "driving_side":"right",
         "geometry":"aateFvaajVV^HJ\`@j@nAbBd@n@JN\`@j@",
         "mode":"cycling",
         "duration":43.1,
         "maneuver":{
            "bearing_after":223,
            "type":"turn",
            "modifier":"left",
            "bearing_before":315,
            "location":[
               -122.39916,
               37.79105
            ]
         },
         "weight":43.1,
         "distance":183,
         "name":"Market Street",
         "pronunciation":""
      },
      {
         "intersections":[
            {
               "out":1,
               "int":0,
               "entry":[
                  false,
                  true,
                  true
               ],
               "bearings":[
                  45,
                  225,
                  240
               ],
               "location":[
                  -122.400635,
                  37.789886
               ]
            },
            {
               "out":3,
               "int":0,
               "entry":[
                  true,
                  false,
                  true,
                  true
               ],
               "bearings":[
                  15,
                  45,
                  135,
                  225
               ],
               "location":[
                  -122.4014,
                  37.789284
               ]
            },
            {
               "out":4,
               "int":0,
               "entry":[
                  true,
                  false,
                  true,
                  true,
                  true
               ],
               "bearings":[
                  0,
                  45,
                  180,
                  210,
                  225
               ],
               "location":[
                  -122.401985,
                  37.78882
               ]
            }
         ],
         "driving_side":"right",
         "geometry":"yyseF~jajVdB~BDFLNLRx@fARXTZHL\\b@",
         "mode":"cycling",
         "duration":30.1,
         "maneuver":{
            "bearing_after":225,
            "type":"fork",
            "modifier":"slight left",
            "bearing_before":225,
            "location":[
               -122.400635,
               37.789886
            ]
         },
         "weight":30.1,
         "distance":216.3,
         "name":"Market Street",
         "pronunciation":""
      },
      {
         "intersections":[
            {
               "out":2,
               "int":0,
               "entry":[
                  false,
                  true,
                  true
               ],
               "bearings":[
                  44,
                  225,
                  232
               ],
               "location":[
                  -122.402374,
                  37.788513
               ]
            }
         ],
         "driving_side":"right",
         "geometry":"eqseFzuajVFJJRf@bAd@l@",
         "mode":"cycling",
         "duration":10.9,
         "maneuver":{
            "bearing_after":232,
            "type":"fork",
            "modifier":"slight right",
            "bearing_before":223,
            "location":[
               -122.402374,
               37.788513
            ]
         },
         "weight":10.9,
         "distance":85.4,
         "name":"Market Street",
         "pronunciation":""
      },
      {
         "intersections":[
            {
               "out":2,
               "int":0,
               "entry":[
                  false,
                  true,
                  true
               ],
               "bearings":[
                  45,
                  225,
                  255
               ],
               "location":[
                  -122.403114,
                  37.788013
               ]
            },
            {
               "out":2,
               "int":0,
               "entry":[
                  false,
                  true,
                  true,
                  true
               ],
               "bearings":[
                  75,
                  165,
                  255,
                  345
               ],
               "location":[
                  -122.403496,
                  37.787964
               ]
            },
            {
               "out":2,
               "int":0,
               "entry":[
                  false,
                  true,
                  true,
                  true
               ],
               "bearings":[
                  75,
                  165,
                  255,
                  345
               ],
               "location":[
                  -122.40506,
                  37.78777
               ]
            },
            {
               "out":2,
               "int":0,
               "entry":[
                  false,
                  true,
                  true,
                  true
               ],
               "bearings":[
                  75,
                  165,
                  255,
                  345
               ],
               "location":[
                  -122.406586,
                  37.787567
               ]
            },
            {
               "out":1,
               "int":0,
               "entry":[
                  false,
                  true,
                  true
               ],
               "bearings":[
                  75,
                  255,
                  345
               ],
               "location":[
                  -122.4067,
                  37.78755
               ]
            }
         ],
         "driving_side":"right",
         "geometry":"cnseFlzajVFn@@\\BTDr@\\lFb@nG@R@LBT?DF\`ABZ@Z",
         "mode":"cycling",
         "duration":100.6,
         "maneuver":{
            "bearing_after":260,
            "type":"turn",
            "modifier":"slight right",
            "bearing_before":223,
            "location":[
               -122.403114,
               37.788013
            ]
         },
         "weight":100.6,
         "distance":376.5,
         "name":"Geary Street",
         "pronunciation":""
      },
      {
         "intersections":[
            {
               "out":2,
               "int":0,
               "entry":[
                  false,
                  true,
                  true
               ],
               "bearings":[
                  75,
                  255,
                  345
               ],
               "location":[
                  -122.40734,
                  37.787476
               ]
            },
            {
               "out":3,
               "int":0,
               "entry":[
                  true,
                  false,
                  true,
                  true
               ],
               "bearings":[
                  75,
                  165,
                  255,
                  345
               ],
               "location":[
                  -122.407364,
                  37.787594
               ]
            }
         ],
         "driving_side":"right",
         "geometry":"wjseFztbjVUBYD",
         "mode":"cycling",
         "duration":10.7,
         "maneuver":{
            "bearing_after":351,
            "type":"turn",
            "modifier":"right",
            "bearing_before":260,
            "location":[
               -122.40734,
               37.787476
            ]
         },
         "weight":10.7,
         "distance":27.1,
         "name":"",
         "pronunciation":""
      },
      {
         "intersections":[
            {
               "out":0,
               "int":0,
               "entry":[
                  true,
                  false,
                  true
               ],
               "bearings":[
                  75,
                  165,
                  255
               ],
               "location":[
                  -122.40739,
                  37.787716
               ]
            }
         ],
         "driving_side":"right",
         "geometry":"glseFdubjVGmAc@F",
         "mode":"cycling",
         "duration":19.3,
         "maneuver":{
            "bearing_after":80,
            "type":"end of road",
            "modifier":"right",
            "bearing_before":351,
            "location":[
               -122.40739,
               37.787716
            ]
         },
         "weight":19.3,
         "distance":54,
         "name":"Union Square Garage (underground)",
         "pronunciation":""
      },
      {
         "intersections":[
            {
               "out":0,
               "int":0,
               "entry":[
                  true
               ],
               "bearings":[
                  171
               ],
               "location":[
                  -122.40704,
                  37.78794
               ]
            }
         ],
         "driving_side":"right",
         "geometry":"smseF~rbjV",
         "mode":"cycling",
         "duration":0,
         "maneuver":{
            "bearing_after":0,
            "type":"arrive",
            "modifier":"",
            "bearing_before":351,
            "location":[
               -122.40704,
               37.78794
            ]
         },
         "weight":0,
         "distance":0,
         "name":"Union Square Garage (underground)",
         "pronunciation":""
      }
   ]
}`}
        </code></pre>
      </div>

      <h2>API Details</h2>
      <p>We made assumptions about weighting different <a
        href="http://wiki.openstreetmap.org/wiki/Highway_tag_usage">OpenStreetMaps road classifications</a> for each
        scenario. For all scenarios, busier road classifications such as “motorway” and “primary” were given a higher weight
        than less busy road classifications such as “tertiary” and “path”. Weights are multipliers on the actual length of
        the link so a higher weight on a segment of road means that we are more likely to avoid routing on that segment.</p>
      <p>The weights used by bikesy for each scenario are shown below:</p>
      <table className="table table-striped table-hover">
        <thead>
          <tr height="20">
            <td width="254" height="20">Type</td>
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
      <p>Let us know how you use the API, send us suggestions for improving it or ask us a question. <a href="mailto:info@blinktag.com">info@blinktag.com</a>.</p>
      <p>Want to contribute? Fork our <a href="http://github.com/brendannee/bikesy">front end</a> or <a href="https://github.com/brendannee/bikesy-server">back end</a> and get going.</p>
    </div>
  </div>
)

export default Api
