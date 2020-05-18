import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import axios from 'axios';

function Dashboard(props) {
  const [currentLocation, setCurrentLocation] = useState();
  const [pollutionScore, setPollutionScore] = useState();
  const [coronaArea, setCoronaArea] = useState();
  
  const [postcode, setPostcode] = useState();
  const [locationData, setLocationData] = useState();

  useEffect(() => {
    
  }, []);


  const getPostcodeFromLocation = (lat, lon) => {
    axios.get(`http://api.postcodes.io/postcodes?lon=${lon}&lat=${lat}?limit=1`)
  .then(function (response) {
    setPostcode(response.data.result[0].postcode || response.data.result.postcode);
  })
  .catch(function (error) {
    console.log(error);
  });

  }

  const getLocation = () => {
    if ('geolocation' in navigator) {
      console.log('Available');
      navigator.geolocation.getCurrentPosition(async function(position) {
        console.log('Latitude is :', position.coords.latitude);
        console.log('Longitude is :', position.coords.longitude);

        await getPostcodeFromLocation(position.coords.latitude, position.coords.longitude);

        setCurrentLocation([position.coords.latitude, position.coords.longitude]);
      });
    } else {
      alert('Current location is not Available');
    }
  }

  const getCoronaData = (district) => {
    console.log('district is', district);
    console.log('inside corona function');
    axios
      .get('https://api.covid19uk.live')
      .then(function(response) {
        setCoronaArea(JSON.parse(response.data.data[0].area).filter(area => area.location == district )[0]);
        
       
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
            //  siteId: `${site}`
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
    };


  const getDataFromPostcode = (postcode) => {
    axios.get(`https://api.postcodes.io/postcodes/${postcode}`)
  .then(function (response) {
    console.log(response.data.result);
    setLocationData(response.data.result);
    
    return response;
  })
  .then(function (response){
   // getPollutionData(response.data.result.latitude, response.data.result.longitude)
    getCoronaData(response.data.result.admin_county || response.data.result.admin_district);
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
    getDataFromPostcode(postcode);
  };

  const coronaLevel = (num) => {

    if (num > 7) return 'high'
    if (num > 4) return 'medium' ;
    if (num > 0) return 'low';

  } 

  return (
    <div className='dashboard'>
    
      <form onSubmit={handleSubmit} className="postcode-form">
        <label >
          <div>Enter a postcode or <span onClick={getLocation}>use current location</span> </div>
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
      7.3
      </div>
      <div className='mask-meter-sub'>
      <div className='mask-meter-corona'> {coronaArea &&
    <p>In {coronaArea.location} the Corona risk level is currently {coronaLevel (coronaArea.number/4500 * 10)} </p>
} </div>
      <div className='mask-meter-pollution'>  <p>The pollution level in your area is {pollutionScore}</p></div>
</div>
      </div>
   
   
    </div>
  )
}

export default Dashboard;
