import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import axios from 'axios';

function Dashboard(props) {
  const [pollutionArea, setPollutionArea] = useState();
  const [pollutionScore, setPollutionScore] = useState();
  const [coronaArea, setCoronaArea] = useState();
  const [postcode, setPostcode] = useState();
  const [locationData, setLocationData] = useState();

  useEffect(() => {
    if ('geolocation' in navigator) {
      console.log('Available');

      navigator.geolocation.getCurrentPosition(function(position) {
        console.log('Latitude is :', position.coords.latitude);
        console.log('Longitude is :', position.coords.longitude);
        setPollutionArea([position.coords.latitude, position.coords.longitude]);
      });
    } else {
      console.log('Not Available');
    }
  }, []);

  function distance(lat1, lon1, lat2, lon2, unit) {
    var radlat1 = (Math.PI * lat1) / 180;
    var radlat2 = (Math.PI * lat2) / 180;
    var theta = lon1 - lon2;
    var radtheta = (Math.PI * theta) / 180;
    var dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit == 'K') {
      dist = dist * 1.609344;
    }
    if (unit == 'N') {
      dist = dist * 0.8684;
    }
    return dist;
  }

  const getCoronaData = (district) => {
    console.log('district is', district);
    console.log('inside corona function');
    axios
      .get('https://api.covid19uk.live')
      .then(function(response) {
        console.log('response CORONA OBJ', JSON.parse(response.data.data[0].area));
        setCoronaArea(JSON.parse(response.data.data[0].area).filter(area => area.location == district )[0]);
        console.log('corona OBJECT', coronaArea)
        // console.log('CORONADATA', JSON.parse(response.data.data[0].area));
        // console.log(
        //   'coronaData',
        //   response.data.data.reduce((a, b) => {
        //     return distance(
        //       b.la,
        //       b.lo,
        //       pollutionArea[0],
        //       pollutionArea[1],
        //       'K'
        //     ) < distance(a.la, a.lo, pollutionArea[0], pollutionArea[1], 'K')
        //       ? b
        //       : a;
        //   })
        // );
      })
      .catch(function(error) {
        console.log(error);
      });
  };

  

  const getPollutionData = (lat, lon) => {

          axios({
            method: 'GET',
           // url: 'https://uk-air-quality.p.rapidapi.com/latestpollutants',
            headers: {
              'content-type': 'application/octet-stream',
              'x-rapidapi-host': 'uk-air-quality.p.rapidapi.com',
              'x-rapidapi-key':
                '1e814ffd8dmsh9958df97ed5b2ffp173a32jsn815ee20b755a',
              useQueryString: true
            },
            params: {
              siteId: `${site}`
            }
          })
            .then(response => {
              console.log(response);
              setPollutionScore(
                
                Math.round(
                  ((Number(response.data.pollutants[0].measurement) +
                    Number(response.data.pollutants[1].measurement)) /
                    2
                ) / 3)
              );
            })
            .catch(error => {
              console.log(error);
            });
       
        
    }
  };


  const getPostcode = (postcode) => {
    axios.get(`https://api.postcodes.io/postcodes/${postcode}`)
  .then(function (response) {
    console.log(response.data.result);
    setLocationData(response.data.result);
    
    return response;
  })
  .then(function (response){
    getPollutionData(response.data.result.latitude, response.data.result.longitude)
    getCoronaData(response.data.result.admin_district);
  })
  .catch(function (error) {
    console.log(error);
  });

  }

  const handleChange = event => {
    setPostcode(event.target.value);
  };

  const handleSubmit = event => {
    event.preventDefault();
    getPostcode(postcode);
  };

  return (
    <div className='dashboard'>
      Hello from dashboard
      <form onSubmit={handleSubmit}>
        <label>
          Enter a postcode
          <input
            type='text'
            name='name'
            value={postcode}
            onChange={handleChange}
          />
        </label>
        <input type='submit' value='Submit' />
      </form>
    <p>The pollution level in your area is {pollutionScore}</p>
    {coronaArea &&
    <p>In {coronaArea.location} there are {coronaArea.number} recorded Corona cases.</p>
}
    </div>
  );
}

export default Dashboard;
