import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import axios from 'axios';
const database = require('../database.js');

//

function Dashboard(props) {
  const [currentLocation, setCurrentLocation] = useState();
  const [pollutionScore, setPollutionScore] = useState();
  const [coronaRate, setCoronaRate] = useState();
  const [coronaArea, setCoronaArea] = useState();
  const [postcode, setPostcode] = useState();
  const [locationData, setLocationData] = useState();

  console.log(database.database);

  const getPostcodeFromLocation = (lat, lon) => {
    axios
      .get(`https://api.postcodes.io/postcodes?lon=${lon}&lat=${lat}?limit=1`)
      .then(function(response) {
        setPostcode(
          response.data.result[0].postcode || response.data.result.postcode
        );
      })
      .catch(function(error) {
        console.log(error);
      });
  };

  const getLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(async function(position) {
        console.log('Latitude is :', position.coords.latitude);
        console.log('Longitude is :', position.coords.longitude);

        await getPostcodeFromLocation(
          position.coords.latitude,
          position.coords.longitude
        );
        setCurrentLocation([
          position.coords.latitude,
          position.coords.longitude
        ]);
      });
    } else {
      alert('Current location is not Available');
    }
  };

  const getCoronaData = district => {
    console.log('district is', district);
    console.log('inside corona function');

    console.log(database.database.filter(entry => entry.area == district))

    const area = database.database.filter(entry => entry.area == district);
    setCoronaArea(area[0].area)
    setCoronaRate((area[0].number/500*10).toFixed(2));
    // axios
    //   .get('https://api.covid19uk.live')
    //   .then(function(response) {
    //     setCoronaArea(
    //       JSON.parse(response.data.data[0].area).filter(
    //         area => area.location == district
    //       )[0]
    //     );
    //   })
    //   .catch(function(error) {
    //     console.log(error);
    //   });
  };

  const getPollutionData = (lat, lon) => {
    console.log('pollution function called');
    axios
      .get(
        `https://api.climacell.co/v3/weather/nowcast?lat=${lat}&lon=${lon}&unit_system=si&timestep=5&start_time=now&fields=epa_aqi&apikey=RS4vSGHNvWvXcRE2J0MMCfLTsFzoVQBa`
      )
      .then(function(response) {
        setPollutionScore(response.data[0].epa_aqi.value / 10 / 2);
        console.log('pol score', pollutionScore)
      })
      .catch(function(error) {
        console.log(error);
      });
  };

  const getDataFromPostcode = postcode => {
    axios
      .get(`https://api.postcodes.io/postcodes/${postcode}`)
      .then(function(response) {
        console.log(response.data.result);
        setLocationData(response.data.result);

        return response;
      })
      .then(function(response) {
        getPollutionData(
          response.data.result.latitude,
          response.data.result.longitude
        );
        getCoronaData(
          response.data.result.admin_county ||
            response.data.result.admin_district
        );
      })
      .catch(function(error) {
        console.log(error);
      });
  };

  const handleChange = event => {
    setPostcode(event.target.value);
  };

  const handleSubmit = event => {
    event.preventDefault();
    getDataFromPostcode(postcode);
  };

  const coronaLevel = num => {
    if (num > 7) return 'high';
    if (num > 4) return 'medium';
    if (num > 0) return 'low';
  };

  const pollutionLevel = num => {
    if (num > 9.9) return 'very unhealthy';
    if (num > 7.5) return 'unhealthy';
    if (num > 5) return 'unhealthy for some';
    if (num > 2.5) return 'moderate';
    if (num > 0) return 'low';
  };

  return (
    <div className='dashboard'>
      <form onSubmit={handleSubmit} className='postcode-form'>
        <label>
          <div>
            Enter a postcode or{' '}
            <span className='current-location' onClick={getLocation}>
              use your current location
            </span>{' '}
          </div>
          <input
            className='postcode-input'
            type='text'
            name='name'
            value={postcode}
            onChange={handleChange}
          />
        </label>
        <input className='postcode-btn' type='submit' value='Generate' />
      </form>

      <div className='mask-meter'>
        <div className='mask-meter-score'>
          {coronaRate && pollutionScore && ((Number(coronaRate) + Number(pollutionScore))/2).toFixed(2)}
        </div>
        <div className='mask-meter-sub'>
          <div className='mask-meter-corona'>
            {' '}
            {coronaRate && (
              <p>
                In {coronaArea} the relative Corona rate is currently{' '}
                {coronaLevel(coronaRate)}{' '}
              </p>
            )}{' '}
          </div>
          
          <div className='mask-meter-pollution'>
            {' '}
            {pollutionScore && (
              <p>
              The pollution level in {coronaArea} is currently{' '}
              {pollutionLevel(pollutionScore)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
