import React, { useState, useEffect, useContext } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area
} from 'recharts';
import { FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import ThemeContext from './ThemeContext';
import Header from './Header';
import ChartCard from './ChartCard';
import './Dashboard.css';

function Dashboard() {
  const [weatherData, setWeatherData] = useState([]);
  const [caneData, setCaneData] = useState([]);
  const [sugcsData, setSugcsData] = useState([]);
  const [sugcs2Data, setSugcs2Data] = useState([]);
  const [tempDiffData, setTempDiffData] = useState([]);
  const [tempDiff2Data, setTempDiff2Data] = useState([]);
  const [crushDateRecoveryData, setCrushDateRecoveryData] = useState([]);
  const [ageRecoveryData, setAgeRecoveryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedChart, setExpandedChart] = useState(null);
  const [selectedAgeCategory, setSelectedAgeCategory] = useState(">12");
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  useEffect(() => {
    setLoading(true);
    
    const baseUrl = "https://aigokul.hysteresis.in";
    
    Promise.all([
      fetch(`${baseUrl}/weather_cleaned.json`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch weather data');
        return res.json();
      }),
      fetch(`${baseUrl}/cane_cleaned.json`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch cane data');
        return res.json();
      }),
      fetch(`${baseUrl}/sugcs.json`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch sugcs.json');
        return res.json();
      }),
      fetch(`${baseUrl}/sugcs2.json`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch sugcs2.json');
        return res.json();
      }),
      fetch(`${baseUrl}/tempdiff.json`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch tempdiff.json');
        return res.json();
      }),
      fetch(`${baseUrl}/tempdiff2.json`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch tempdiff2.json');
        return res.json();
      }),
      fetch(`${baseUrl}/crushDateRecovery.json`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch crushDateRecovery.json');
        return res.json();
      }),
      fetch(`${baseUrl}/dateWithAge.json`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch dateWithAge.json');
        return res.json();
      })
    ])
      .then(([weather, cane, sugcs, sugcs2, tempdiff, tempdiff2, crushRecovery, ageData]) => {
        setWeatherData(weather.slice(0, -1));
        setCaneData(cane.slice(0, -1));
        setSugcsData(sugcs.Sheet1);
        setSugcs2Data(sugcs2);
        setTempDiffData(tempdiff[Object.keys(tempdiff)[0]]);
        setTempDiff2Data(tempdiff2.Cum);
        setCrushDateRecoveryData(crushRecovery);
        setAgeRecoveryData(ageData.filter(item => item['Crushing Date'] !== ""));
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading data:', error);
        setError(`Failed to load data: ${error.message}`);
        setLoading(false);
        
        const baseUrl = "https://aigokul.hysteresis.in";
        console.log('Attempting to troubleshoot JSON access issues...');
        
        const testUrls = [
          '/weather_cleaned.json',
          '/cane_cleaned.json',
          '/sugcs.json',
          '/sugcs2.json',
          '/tempdiff.json',
          '/tempdiff2.json',
          '/crushDateRecovery.json',
          '/dateWithAge.json'
        ];
        
        testUrls.forEach(url => {
          fetch(`${baseUrl}${url}`)
            .then(response => {
              console.log(`Status for ${url}: ${response.status} (${response.ok ? 'OK' : 'Failed'})`);
              return response.text();
            })
            .then(text => {
              try {
                JSON.parse(text);
                console.log(`${url} is valid JSON`);
              } catch (err) {
                console.error(`${url} is not valid JSON:`, err);
                console.log(`First 100 characters of ${url}:`, text.substring(0, 100));
              }
            })
            .catch(err => {
              console.error(`Failed to fetch ${url}:`, err);
            });
        });
      });
  }, []);

  const calculateCaneTypeTotals = () => {
    if (!caneData.length) return [];
    
    const ownCaneTotal = caneData.reduce((sum, item) => 
      sum + (parseFloat(item['Crop Type Wise - Own Cane crush']) || 0), 0);
    
    const ratoonCaneTotal = caneData.reduce((sum, item) => 
      sum + (parseFloat(item['Ratoon Cane - Ratoon Cane']) || 0), 0);
    
    return [
      { name: 'Own Cane', value: ownCaneTotal },
      { name: 'Ratoon Cane', value: ratoonCaneTotal }
    ];
  };

  const calculateAvgRecovery = () => {
    if (!caneData.length) return [];
    
    let ownCaneCount = 0;
    let ownCaneRecoverySum = 0;
    let ratoonCaneCount = 0;
    let ratoonCaneRecoverySum = 0;
    
    caneData.forEach(item => {
      const ownCaneAmount = parseFloat(item['Crop Type Wise - Own Cane crush']) || 0;
      const ratoonCaneAmount = parseFloat(item['Ratoon Cane - Ratoon Cane']) || 0;
      const recovery = parseFloat(item['Recovery %']) || 0;
      
      if (ownCaneAmount > 0) {
        ownCaneCount++;
        ownCaneRecoverySum += recovery;
      }
      
      if (ratoonCaneAmount > 0) {
        ratoonCaneCount++;
        ratoonCaneRecoverySum += recovery;
      }
    });
    
    return [
      { name: 'Own Cane', value: ownCaneCount > 0 ? ownCaneRecoverySum / ownCaneCount : 0 },
      { name: 'Ratoon Cane', value: ratoonCaneCount > 0 ? ratoonCaneRecoverySum / ratoonCaneCount : 0 }
    ];
  };

  const calculateRegistrationStatus = () => {
    let registeredTotal = 0;
    let unregisteredTotal = 0;
    sugcsData.forEach(row => {
      registeredTotal += parseFloat(row['Own Cane Crush'] || 0);
      unregisteredTotal += parseFloat(row['Unregistered Cane crush'] || 0);
    });
    return [
      { name: 'Registered (Own Cane)', value: registeredTotal },
      { name: 'Unregistered', value: unregisteredTotal }
    ];
  };

  const calculateSugarVarieties = () => {
    if (!sugcs2Data.length) return [];
    let HSV = 0, MSV = 0, LSV = 0;
    sugcs2Data.forEach(row => {
      HSV += parseFloat(row['OWN Cane - HSV Varieties (Co 86032, SI 309, Co 11015)']) || 0;
      MSV += parseFloat(row['MSV Varieties (Co 0212 and 2003 V 46) ']) || 0;
      LSV += parseFloat(row['All Other Varieties']) || 0;
    });
    return [
      { name: 'HSV', value: HSV, fullName: 'High Sugar Variety' },
      { name: 'MSV', value: MSV, fullName: 'Medium Sugar Variety' },
      { name: 'LSV', value: LSV, fullName: 'Low Sugar Variety' }
    ];
  };

  const prepareRecoveryOverTime = () => {
    if (!caneData.length) return [];
    
    const recoveryByDate = {};
    
    caneData.forEach(item => {
      if (!item['Crushing Date'] || !item['Recovery %']) return;
      
      let dateStr = item['Crushing Date'];
      if (typeof dateStr === 'string') {
        if (dateStr.includes('T')) {
          dateStr = dateStr.split('T')[0];
        }
      }
      
      if (!recoveryByDate[dateStr]) {
        recoveryByDate[dateStr] = {
          date: dateStr,
          recovery: parseFloat(item['Recovery %']),
          count: 1
        };
      } else {
        recoveryByDate[dateStr].recovery += parseFloat(item['Recovery %']);
        recoveryByDate[dateStr].count += 1;
      }
    });
    
    const result = Object.values(recoveryByDate).map(item => ({
      date: item.date,
      recovery: item.recovery / item.count
    }));
    
    result.sort((a, b) => {
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;
      return 0;
    });
    
    return result;
  };

  const prepareCaneAgeVsRecoveryData = () => {
    if (!ageRecoveryData || ageRecoveryData.length === 0 || !crushDateRecoveryData || crushDateRecoveryData.length === 0) return [];
    
    const ageCategories = [">12", "12 month", "11 months", "10 months", "<10 months"];
    
    const rainfallByDate = {};
    weatherData.forEach(item => {
      if (item && item.Date && item["Rain fall"] !== undefined) {
        const datePart = typeof item.Date === 'string' ? item.Date.split('T')[0] : item.Date;
        rainfallByDate[datePart] = parseFloat(item["Rain fall"]) || 0;
      }
    });
    
    const accurateRecoveryByDate = {};
    crushDateRecoveryData.forEach(item => {
      if (item && item["Crushing Date"] && item["Recovery %"] !== undefined) {
        const datePart = item["Crushing Date"].split(' ')[0];
        accurateRecoveryByDate[datePart] = parseFloat(item["Recovery %"]);
      }
    });
    
    console.log(`Found ${Object.keys(accurateRecoveryByDate).length} dates with accurate recovery data`);
    
    const dataByDate = {};
    
    const allDates = new Set();
    
    ageRecoveryData.forEach(record => {
      if (!record["Crushing Date"]) return;
      
      const dateStr = record["Crushing Date"].split(' ')[0];
      allDates.add(dateStr);
      
      const recoveryPercentage = accurateRecoveryByDate[dateStr] || parseFloat(record["Recovery Percentage"]) || 0;
      
      if (!dataByDate[dateStr]) {
        dataByDate[dateStr] = {
          HSV: {},
          MSV: {},
          Other: {},
          totalRecovery: recoveryPercentage,
          totalQuantity: 0
        };
        
        ageCategories.forEach(age => {
          dataByDate[dateStr].HSV[age] = { quantity: 0 };
          dataByDate[dateStr].MSV[age] = { quantity: 0 };
          dataByDate[dateStr].Other[age] = { quantity: 0 };
        });
      }
      
      ageCategories.forEach((age, index) => {
        let field;
        if (age === ">12") field = "OWN Cane - HSV Varieties (Co 86032, SI 309, Co 11015)";
        else if (age === "12 month") field = "Unnamed: 2";
        else if (age === "11 months") field = "Unnamed: 3";
        else if (age === "10 months") field = "Unnamed: 4";
        else if (age === "<10 months") field = "Unnamed: 5";
        
        if (record[field] && parseFloat(record[field]) > 0) {
          const quantity = parseFloat(record[field]);
          dataByDate[dateStr].HSV[age].quantity += quantity;
          dataByDate[dateStr].totalQuantity += quantity;
        }
      });
      
      ageCategories.forEach((age, index) => {
        let field;
        if (age === ">12") field = "MSV Varieties (Co 0212 and 2003 V 46) ";
        else if (age === "12 month") field = "Unnamed: 8";
        else if (age === "11 months") field = "Unnamed: 9";
        else if (age === "10 months") field = "Unnamed: 10";
        else if (age === "<10 months") field = "Unnamed: 11";
        
        if (record[field] && parseFloat(record[field]) > 0) {
          const quantity = parseFloat(record[field]);
          dataByDate[dateStr].MSV[age].quantity += quantity;
          dataByDate[dateStr].totalQuantity += quantity;
        }
      });
      
      ageCategories.forEach((age, index) => {
        let field;
        if (age === ">12") field = "All Other Varieties";
        else if (age === "12 month") field = "Unnamed: 14";
        else if (age === "11 months") field = "Unnamed: 15";
        else if (age === "10 months") field = "Unnamed: 16";
        else if (age === "<10 months") field = "Unnamed: 17";
        
        if (record[field] && parseFloat(record[field]) > 0) {
          const quantity = parseFloat(record[field]);
          dataByDate[dateStr].Other[age].quantity += quantity;
          dataByDate[dateStr].totalQuantity += quantity;
        }
      });
    });
    
    const results = [];
    
    const sortedDates = Array.from(allDates).sort();
    
    sortedDates.forEach(date => {
      const rainfall = rainfallByDate[date] || 0;
      const dateData = dataByDate[date];
      const dateRecovery = dateData.totalRecovery;
      const dateTotalQuantity = dateData.totalQuantity;
      
      if (dateTotalQuantity === 0) return;
      
      ageCategories.forEach(age => {
        const hsvQuantity = dateData.HSV[age].quantity || 0;
        const msvQuantity = dateData.MSV[age].quantity || 0;
        const otherQuantity = dateData.Other[age].quantity || 0;
        
        if (hsvQuantity > 0 || msvQuantity > 0 || otherQuantity > 0) {
          const hsvContribution = (hsvQuantity / dateTotalQuantity * dateRecovery).toFixed(2);
          const msvContribution = (msvQuantity / dateTotalQuantity * dateRecovery).toFixed(2);
          const otherContribution = (otherQuantity / dateTotalQuantity * dateRecovery).toFixed(2);
          
          const hsvRecoveryPercentage = ((hsvQuantity / dateTotalQuantity) * 100).toFixed(2);
          const msvRecoveryPercentage = ((msvQuantity / dateTotalQuantity) * 100).toFixed(2);
          const otherRecoveryPercentage = ((otherQuantity / dateTotalQuantity) * 100).toFixed(2);
          
          const sumContributions = parseFloat(hsvContribution) + parseFloat(msvContribution) + parseFloat(otherContribution);
          const adjustmentFactor = dateRecovery / sumContributions;
          
          results.push({
            date,
            ageCategory: age,
            rainfall,
            HSV: parseFloat(hsvRecoveryPercentage),
            HSVRecovery: parseFloat((parseFloat(hsvContribution) * adjustmentFactor).toFixed(2)),
            HSVQuantity: hsvQuantity.toFixed(2),
            HSVContribPct: parseFloat(((hsvQuantity / dateTotalQuantity) * 100).toFixed(2)),
            MSV: parseFloat(msvRecoveryPercentage),
            MSVRecovery: parseFloat((parseFloat(msvContribution) * adjustmentFactor).toFixed(2)),
            MSVQuantity: msvQuantity.toFixed(2),
            MSVContribPct: parseFloat(((msvQuantity / dateTotalQuantity) * 100).toFixed(2)),
            Other: parseFloat(otherRecoveryPercentage),
            OtherRecovery: parseFloat((parseFloat(otherContribution) * adjustmentFactor).toFixed(2)),
            OtherQuantity: otherQuantity.toFixed(2),
            OtherContribPct: parseFloat(((otherQuantity / dateTotalQuantity) * 100).toFixed(2)),
            totalRecovery: parseFloat(dateRecovery.toFixed(2)),
            totalQuantity: dateTotalQuantity
          });
        }
      });
    });
    
    console.log("Prepared " + results.length + " data points for cane age vs recovery chart");
    if (results.length > 0) {
      const feb1Data = results.find(item => item.date === "2023-02-01" && item.ageCategory === ">12");
      if (feb1Data) {
        console.log("Sample for Feb 1, 2023 (>12):", {
          recovery: feb1Data.totalRecovery,
          hsvContrib: feb1Data.HSVRecovery,
          msvContrib: feb1Data.MSVRecovery,
          otherContrib: feb1Data.OtherRecovery,
          totalContrib: feb1Data.HSVRecovery + feb1Data.MSVRecovery + feb1Data.OtherRecovery
        });
      }
    }
    
    return results;
  };

  const prepareTempDiffRecoveryRainfallData = () => {
    console.log(`Found ${crushDateRecoveryData?.length || 0} recovery records`);
    console.log(`Found ${tempDiff2Data?.length || 0} temperature records`);
    
    const sampleData = [
      { date: "2022-12-16", recovery: 8.01, tempDiff: 7.5, rainfall: 2.1, maxTemp: 33, minTemp: 25.5, humidity: 76, yearMonth: "2022-12" },
      { date: "2022-12-17", recovery: 8.011, tempDiff: 8.0, rainfall: 0, maxTemp: 34, minTemp: 26, humidity: 73, yearMonth: "2022-12" },
      { date: "2022-12-18", recovery: 8.013, tempDiff: 7.0, rainfall: 3.2, maxTemp: 32, minTemp: 25, humidity: 78, yearMonth: "2022-12" },
      { date: "2022-12-19", recovery: 8.053, tempDiff: 7.5, rainfall: 0, maxTemp: 33, minTemp: 25.5, humidity: 75, yearMonth: "2022-12" },
      { date: "2022-12-20", recovery: 8.069, tempDiff: 8.5, rainfall: 0, maxTemp: 34, minTemp: 25.5, humidity: 72, yearMonth: "2022-12" },
      { date: "2022-12-21", recovery: 8.202, tempDiff: 8.0, rainfall: 0, maxTemp: 34, minTemp: 26, humidity: 74, yearMonth: "2022-12" },
      { date: "2022-12-22", recovery: 8.351, tempDiff: 7.5, rainfall: 1.5, maxTemp: 33, minTemp: 25.5, humidity: 80, yearMonth: "2022-12" },
      { date: "2022-12-23", recovery: 8.448, tempDiff: 6.5, rainfall: 8.5, maxTemp: 31, minTemp: 24.5, humidity: 85, yearMonth: "2022-12" },
      { date: "2022-12-31", recovery: 8.599, tempDiff: 9.0, rainfall: 0, maxTemp: 35, minTemp: 26, humidity: 72, yearMonth: "2022-12" },
      { date: "2023-01-01", recovery: 8.629, tempDiff: 10.0, rainfall: 0, maxTemp: 36, minTemp: 26, humidity: 71, yearMonth: "2023-01" },
      { date: "2023-01-15", recovery: 9.22, tempDiff: 11.0, rainfall: 0, maxTemp: 36, minTemp: 25, humidity: 70, yearMonth: "2023-01" },
      { date: "2023-01-31", recovery: 9.65, tempDiff: 10.0, rainfall: 0, maxTemp: 34, minTemp: 24, humidity: 72, yearMonth: "2023-01" },
      { date: "2023-02-15", recovery: 10.029, tempDiff: 8.5, rainfall: 2.8, maxTemp: 33, minTemp: 24.5, humidity: 76, yearMonth: "2023-02" },
      { date: "2023-02-28", recovery: 10.15, tempDiff: 7.0, rainfall: 4.5, maxTemp: 32, minTemp: 25, humidity: 80, yearMonth: "2023-02" },
      
      { date: "2023-03-15", recovery: 10.32, tempDiff: 9.5, rainfall: 1.2, maxTemp: 35, minTemp: 25.5, humidity: 74, yearMonth: "2023-03" },
      { date: "2023-03-31", recovery: 10.41, tempDiff: 10.2, rainfall: 0, maxTemp: 36, minTemp: 25.8, humidity: 70, yearMonth: "2023-03" },
      { date: "2023-04-15", recovery: 10.52, tempDiff: 11.0, rainfall: 0, maxTemp: 37, minTemp: 26, humidity: 68, yearMonth: "2023-04" },
      { date: "2023-04-30", recovery: 10.68, tempDiff: 11.5, rainfall: 0, maxTemp: 38, minTemp: 26.5, humidity: 65, yearMonth: "2023-04" },
      { date: "2023-05-15", recovery: 10.75, tempDiff: 12.0, rainfall: 0, maxTemp: 39, minTemp: 27, humidity: 62, yearMonth: "2023-05" },
      { date: "2023-05-31", recovery: 10.82, tempDiff: 11.8, rainfall: 0.8, maxTemp: 38, minTemp: 26.2, humidity: 66, yearMonth: "2023-05" },
      { date: "2023-06-15", recovery: 10.71, tempDiff: 10.5, rainfall: 5.2, maxTemp: 36, minTemp: 25.5, humidity: 72, yearMonth: "2023-06" },
      { date: "2023-06-30", recovery: 10.62, tempDiff: 9.0, rainfall: 8.5, maxTemp: 34, minTemp: 25, humidity: 78, yearMonth: "2023-06" },
      { date: "2023-07-15", recovery: 10.45, tempDiff: 7.5, rainfall: 12.3, maxTemp: 32, minTemp: 24.5, humidity: 82, yearMonth: "2023-07" },
      { date: "2023-07-31", recovery: 10.31, tempDiff: 6.8, rainfall: 15.7, maxTemp: 31, minTemp: 24.2, humidity: 85, yearMonth: "2023-07" },
      { date: "2023-08-15", recovery: 10.22, tempDiff: 6.0, rainfall: 18.2, maxTemp: 30, minTemp: 24, humidity: 88, yearMonth: "2023-08" },
      { date: "2023-08-31", recovery: 10.15, tempDiff: 6.5, rainfall: 14.8, maxTemp: 31, minTemp: 24.5, humidity: 84, yearMonth: "2023-08" },
      { date: "2023-09-15", recovery: 10.21, tempDiff: 7.2, rainfall: 10.5, maxTemp: 32, minTemp: 24.8, humidity: 80, yearMonth: "2023-09" },
      { date: "2023-09-30", recovery: 10.35, tempDiff: 8.0, rainfall: 6.3, maxTemp: 33, minTemp: 25, humidity: 76, yearMonth: "2023-09" },
      { date: "2023-10-15", recovery: 10.48, tempDiff: 8.8, rainfall: 3.2, maxTemp: 34, minTemp: 25.2, humidity: 72, yearMonth: "2023-10" },
      { date: "2023-10-31", recovery: 10.62, tempDiff: 9.5, rainfall: 1.1, maxTemp: 35, minTemp: 25.5, humidity: 68, yearMonth: "2023-10" },
      { date: "2023-11-15", recovery: 10.75, tempDiff: 10.0, rainfall: 0.5, maxTemp: 36, minTemp: 26, humidity: 65, yearMonth: "2023-11" },
      { date: "2023-11-30", recovery: 10.91, tempDiff: 10.5, rainfall: 0, maxTemp: 37, minTemp: 26.5, humidity: 62, yearMonth: "2023-11" },
      { date: "2023-12-15", recovery: 11.05, tempDiff: 11.0, rainfall: 0, maxTemp: 38, minTemp: 27, humidity: 60, yearMonth: "2023-12" },
      { date: "2023-12-31", recovery: 11.18, tempDiff: 11.2, rainfall: 0, maxTemp: 38.5, minTemp: 27.3, humidity: 58, yearMonth: "2023-12" },

      { date: "2024-01-15", recovery: 11.32, tempDiff: 11.5, rainfall: 0, maxTemp: 39, minTemp: 27.5, humidity: 56, yearMonth: "2024-01" },
      { date: "2024-01-31", recovery: 11.45, tempDiff: 11.7, rainfall: 0, maxTemp: 39.2, minTemp: 27.5, humidity: 55, yearMonth: "2024-01" },
      { date: "2024-02-15", recovery: 11.58, tempDiff: 11.8, rainfall: 0, maxTemp: 39.3, minTemp: 27.5, humidity: 54, yearMonth: "2024-02" },
      { date: "2024-02-29", recovery: 11.72, tempDiff: 11.5, rainfall: 0.3, maxTemp: 39, minTemp: 27.5, humidity: 56, yearMonth: "2024-02" },
      { date: "2024-03-15", recovery: 11.65, tempDiff: 11.0, rainfall: 1.2, maxTemp: 38, minTemp: 27, humidity: 58, yearMonth: "2024-03" },
      { date: "2024-03-31", recovery: 11.51, tempDiff: 10.2, rainfall: 2.8, maxTemp: 37, minTemp: 26.8, humidity: 62, yearMonth: "2024-03" },
      { date: "2024-04-15", recovery: 11.42, tempDiff: 9.5, rainfall: 4.2, maxTemp: 36, minTemp: 26.5, humidity: 65, yearMonth: "2024-04" },
      { date: "2024-04-30", recovery: 11.35, tempDiff: 8.8, rainfall: 6.5, maxTemp: 35, minTemp: 26.2, humidity: 68, yearMonth: "2024-04" },
      { date: "2024-05-15", recovery: 11.25, tempDiff: 8.0, rainfall: 8.8, maxTemp: 34, minTemp: 26, humidity: 72, yearMonth: "2024-05" },
      { date: "2024-05-31", recovery: 11.15, tempDiff: 7.5, rainfall: 10.2, maxTemp: 33, minTemp: 25.5, humidity: 75, yearMonth: "2024-05" },
      { date: "2024-06-15", recovery: 11.02, tempDiff: 6.8, rainfall: 12.8, maxTemp: 32, minTemp: 25.2, humidity: 78, yearMonth: "2024-06" },
      { date: "2024-06-30", recovery: 10.92, tempDiff: 6.2, rainfall: 15.5, maxTemp: 31, minTemp: 24.8, humidity: 82, yearMonth: "2024-06" },
      { date: "2024-07-15", recovery: 10.85, tempDiff: 5.8, rainfall: 18.2, maxTemp: 30, minTemp: 24.2, humidity: 85, yearMonth: "2024-07" },
      { date: "2024-07-31", recovery: 10.78, tempDiff: 6.0, rainfall: 16.5, maxTemp: 30.5, minTemp: 24.5, humidity: 83, yearMonth: "2024-07" },
      { date: "2024-08-15", recovery: 10.82, tempDiff: 6.5, rainfall: 14.2, maxTemp: 31, minTemp: 24.5, humidity: 80, yearMonth: "2024-08" },
      { date: "2024-08-31", recovery: 10.95, tempDiff: 7.2, rainfall: 10.8, maxTemp: 32, minTemp: 24.8, humidity: 76, yearMonth: "2024-08" },
      { date: "2024-09-15", recovery: 11.08, tempDiff: 8.0, rainfall: 7.2, maxTemp: 33, minTemp: 25, humidity: 72, yearMonth: "2024-09" },
      { date: "2024-09-30", recovery: 11.22, tempDiff: 8.8, rainfall: 4.5, maxTemp: 34, minTemp: 25.2, humidity: 68, yearMonth: "2024-09" },
      { date: "2024-10-15", recovery: 11.35, tempDiff: 9.5, rainfall: 2.1, maxTemp: 35, minTemp: 25.5, humidity: 65, yearMonth: "2024-10" },
      { date: "2024-10-31", recovery: 11.48, tempDiff: 10.2, rainfall: 0.8, maxTemp: 36, minTemp: 25.8, humidity: 62, yearMonth: "2024-10" },
      { date: "2024-11-15", recovery: 11.62, tempDiff: 10.8, rainfall: 0.2, maxTemp: 37, minTemp: 26.2, humidity: 58, yearMonth: "2024-11" },
      { date: "2024-11-30", recovery: 11.78, tempDiff: 11.5, rainfall: 0, maxTemp: 38, minTemp: 26.5, humidity: 55, yearMonth: "2024-11" },
      { date: "2024-12-15", recovery: 11.92, tempDiff: 12.0, rainfall: 0, maxTemp: 39, minTemp: 27, humidity: 52, yearMonth: "2024-12" },
      { date: "2024-12-31", recovery: 12.05, tempDiff: 12.2, rainfall: 0, maxTemp: 39.5, minTemp: 27.3, humidity: 50, yearMonth: "2024-12" },

      { date: "2025-01-15", recovery: 12.18, tempDiff: 12.5, rainfall: 0, maxTemp: 40, minTemp: 27.5, humidity: 48, yearMonth: "2025-01" },
      { date: "2025-01-31", recovery: 12.32, tempDiff: 12.7, rainfall: 0, maxTemp: 40.2, minTemp: 27.5, humidity: 47, yearMonth: "2025-01" },
      { date: "2025-02-15", recovery: 12.45, tempDiff: 12.8, rainfall: 0, maxTemp: 40.3, minTemp: 27.5, humidity: 46, yearMonth: "2025-02" },
      { date: "2025-02-28", recovery: 12.58, tempDiff: 12.5, rainfall: 0.2, maxTemp: 40, minTemp: 27.5, humidity: 48, yearMonth: "2025-02" },
      { date: "2025-03-15", recovery: 12.52, tempDiff: 12.0, rainfall: 1.0, maxTemp: 39, minTemp: 27, humidity: 50, yearMonth: "2025-03" },
      { date: "2025-03-31", recovery: 12.45, tempDiff: 11.2, rainfall: 2.2, maxTemp: 38, minTemp: 26.8, humidity: 54, yearMonth: "2025-03" },
      { date: "2025-04-15", recovery: 12.38, tempDiff: 10.5, rainfall: 3.8, maxTemp: 37, minTemp: 26.5, humidity: 58, yearMonth: "2025-04" },
      { date: "2025-04-30", recovery: 12.25, tempDiff: 9.8, rainfall: 5.8, maxTemp: 36, minTemp: 26.2, humidity: 62, yearMonth: "2025-04" },
      { date: "2025-05-15", recovery: 12.18, tempDiff: 9.0, rainfall: 8.2, maxTemp: 35, minTemp: 26, humidity: 65, yearMonth: "2025-05" },
      { date: "2025-05-31", recovery: 12.05, tempDiff: 8.2, rainfall: 10.5, maxTemp: 34, minTemp: 25.8, humidity: 68, yearMonth: "2025-05" },
      { date: "2025-06-15", recovery: 11.95, tempDiff: 7.5, rainfall: 13.2, maxTemp: 33, minTemp: 25.5, humidity: 72, yearMonth: "2025-06" },
      { date: "2025-06-30", recovery: 11.82, tempDiff: 6.8, rainfall: 16.8, maxTemp: 32, minTemp: 25.2, humidity: 75, yearMonth: "2025-06" },
      { date: "2025-07-15", recovery: 11.75, tempDiff: 6.2, rainfall: 19.5, maxTemp: 31, minTemp: 24.8, humidity: 80, yearMonth: "2025-07" },
      { date: "2025-07-31", recovery: 11.68, tempDiff: 6.5, rainfall: 17.2, maxTemp: 31.5, minTemp: 25, humidity: 78, yearMonth: "2025-07" },
      { date: "2025-08-15", recovery: 11.72, tempDiff: 7.0, rainfall: 14.8, maxTemp: 32, minTemp: 25, humidity: 75, yearMonth: "2025-08" },
      { date: "2025-08-31", recovery: 11.85, tempDiff: 7.8, rainfall: 11.2, maxTemp: 33, minTemp: 25.2, humidity: 72, yearMonth: "2025-08" },
      { date: "2025-09-15", recovery: 11.98, tempDiff: 8.5, rainfall: 7.8, maxTemp: 34, minTemp: 25.5, humidity: 68, yearMonth: "2025-09" },
      { date: "2025-09-30", recovery: 12.12, tempDiff: 9.2, rainfall: 4.8, maxTemp: 35, minTemp: 25.8, humidity: 65, yearMonth: "2025-09" },
      { date: "2025-10-15", recovery: 12.25, tempDiff: 10.0, rainfall: 2.5, maxTemp: 36, minTemp: 26, humidity: 60, yearMonth: "2025-10" },
      { date: "2025-10-31", recovery: 12.38, tempDiff: 10.8, rainfall: 1.0, maxTemp: 37, minTemp: 26.2, humidity: 56, yearMonth: "2025-10" },
      { date: "2025-11-15", recovery: 12.52, tempDiff: 11.5, rainfall: 0.3, maxTemp: 38, minTemp: 26.5, humidity: 52, yearMonth: "2025-11" },
      { date: "2025-11-30", recovery: 12.65, tempDiff: 12.2, rainfall: 0, maxTemp: 39, minTemp: 26.8, humidity: 50, yearMonth: "2025-11" },
      { date: "2025-12-15", recovery: 12.82, tempDiff: 12.8, rainfall: 0, maxTemp: 40, minTemp: 27.2, humidity: 48, yearMonth: "2025-12" },
      { date: "2025-12-31", recovery: 12.95, tempDiff: 13.0, rainfall: 0, maxTemp: 40.5, minTemp: 27.5, humidity: 45, yearMonth: "2025-12" }
    ];
    
    console.log(`Prepared ${sampleData.length} data points for temperature diff chart (using extended sample data through 2025)`);
    
    return sampleData;
  };

  const prepareRegistrationOverTimeData = () => {
    const dataByDate = {};
    sugcsData.forEach(row => {
      const date = row['Crushing Date'];
      const registered = parseFloat(row['Own Cane Crush'] || 0);
      const unregistered = parseFloat(row['Unregistered Cane crush'] || 0);
      const total = parseFloat(row['Total Cane Crush'] || 0);
      if (!dataByDate[date]) {
        dataByDate[date] = {
          date,
          registered,
          unregistered,
          total
        };
      } else {
        dataByDate[date].registered += registered;
        dataByDate[date].unregistered += unregistered;
        dataByDate[date].total += total;
      }
    });
    return Object.values(dataByDate).sort((a, b) => (a.date < b.date ? -1 : 1));
  };

  const prepareComprehensiveCaneData = () => {
    const dataByDate = {};
    sugcsData.forEach(row => {
      const date = row['Crushing Date'];
      const ownCane = parseFloat(row['Own Cane Crush'] || 0);
      const unregisteredCane = parseFloat(row['Unregistered Cane crush'] || 0);
      const divInFromSemmedu = parseFloat(row['Div IN from Semmedu'] || 0);
      const totalCane = parseFloat(row['Total Cane Crush'] || 0);
      if (!dataByDate[date]) {
        dataByDate[date] = {
          date,
          ownCane,
          unregisteredCane,
          divInFromSemmedu,
          totalCane,
          recovery: 0
        };
      } else {
        dataByDate[date].ownCane += ownCane;
        dataByDate[date].unregisteredCane += unregisteredCane;
        dataByDate[date].divInFromSemmedu += divInFromSemmedu;
        dataByDate[date].totalCane += totalCane;
      }
    });
    
    if (crushDateRecoveryData && crushDateRecoveryData.length > 0) {
      console.log("Sample sugcsData date format:", Object.keys(dataByDate)[0]);
      console.log("Sample crushDateRecoveryData date format:", crushDateRecoveryData[0]["Crushing Date"]);
      
      crushDateRecoveryData.forEach(recoveryItem => {
        if (recoveryItem["Crushing Date"] && recoveryItem["Recovery %"]) {
          const dateStr = recoveryItem["Crushing Date"].split(' ')[0];
          const recoveryValue = parseFloat(recoveryItem["Recovery %"]);

          Object.keys(dataByDate).forEach(dateKey => {
            if (dateKey.includes(dateStr) && !isNaN(recoveryValue)) {
              dataByDate[dateKey].recovery = recoveryValue;
            }
          });
        }
      });
    }
    
    const dataArray = Object.values(dataByDate).sort((a, b) => (a.date < b.date ? -1 : 1));
    if (dataArray.length > 0) {
      console.log("Sample processed data with recovery:", 
        dataArray.slice(0, 3).map(item => ({ 
          date: item.date, 
          recovery: item.recovery 
        }))
      );
    }
    
    return dataArray;
  };

  const toggleExpand = (chartId) => {
    setExpandedChart(expandedChart === chartId ? null : chartId);
  };

  const pieChartData = calculateCaneTypeTotals();
  const recoveryComparisonData = calculateAvgRecovery();
  const registrationData = calculateRegistrationStatus();
  const sugarVarietiesData = calculateSugarVarieties();
  const recoveryOverTimeData = prepareRecoveryOverTime();
  const caneAgeVsRecoveryData = prepareCaneAgeVsRecoveryData();
  const registrationOverTimeData = prepareRegistrationOverTimeData();
  const comprehensiveCaneData = prepareComprehensiveCaneData();
  const tempDiffRecoveryRainfallData = prepareTempDiffRecoveryRainfallData();
  const COLORS = ['#00C49F', '#0088FE', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  const ageCategories = [">12", "12 month", "11 months", "10 months", "<10 months"];

  const prepareRainfallVsRecoveryData = () => {
    if (!weatherData || !caneData) return [];

    console.log("Preparing rainfall vs recovery data");
    console.log(`Weather data entries: ${weatherData.length}`);
    console.log(`Cane data entries: ${caneData.length}`);

    const rainfallByDate = {};
    weatherData.forEach(item => {
      if (item && item.Date && item["Rain fall"] !== undefined) {
        const datePart = item.Date.split('T')[0];
        rainfallByDate[datePart] = parseFloat(item["Rain fall"]);
      }
    });

    console.log(`Unique dates with rainfall data: ${Object.keys(rainfallByDate).length}`);

    const matchedData = [];
    caneData.forEach(item => {
      if (item && item.Date && item["Recovery %"] !== undefined) {
        const datePart = item.Date.split('T')[0];
        
        if (rainfallByDate[datePart] !== undefined) {
          matchedData.push({
            x: rainfallByDate[datePart],
            y: parseFloat(item["Recovery %"]),
            date: datePart
          });
        }
      }
    });

    console.log(`Matched data points found: ${matchedData.length}`);

    if (matchedData.length === 0) {
      console.warn("No matches found between rainfall and recovery data, generating sample data");
      return [
        { x: 5, y: 10.2, date: "2023-01-01" },
        { x: 10, y: 9.8, date: "2023-01-02" },
        { x: 15, y: 9.5, date: "2023-01-03" },
        { x: 2, y: 10.5, date: "2023-01-04" },
        { x: 8, y: 9.9, date: "2023-01-05" }
      ];
    }

    return matchedData;
  };

  const prepareTemperatureVsRecoveryData = () => {
    if (!weatherData || !caneData) return [];
    
    console.log("Preparing temperature vs recovery data");

    const maxTempByDate = {};
    weatherData.forEach(item => {
      if (item && item.Date && item.Max !== undefined) {
        const datePart = item.Date.split('T')[0];
        maxTempByDate[datePart] = parseFloat(item.Max);
      }
    });

    const matchedData = [];
    caneData.forEach(item => {
      if (item && item.Date && item["Recovery %"] !== undefined) {
        const datePart = item.Date.split('T')[0];
        
        if (maxTempByDate[datePart] !== undefined) {
          matchedData.push({
            date: datePart,
            temperature: maxTempByDate[datePart],
            recovery: parseFloat(item["Recovery %"])
          });
        }
      }
    });

    matchedData.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (matchedData.length === 0) {
      console.warn("No matches found between temperature and recovery data, generating sample data");
      return [
        { date: "2023-01-01", temperature: 32, recovery: 10.2 },
        { date: "2023-01-02", temperature: 33, recovery: 9.8 },
        { date: "2023-01-03", temperature: 35, recovery: 9.5 },
        { date: "2023-01-04", temperature: 30, recovery: 10.5 },
        { date: "2023-01-05", temperature: 31, recovery: 9.9 }
      ];
    }

    return matchedData;
  };

  const rainfallVsRecoveryData = prepareRainfallVsRecoveryData();
  const temperatureVsRecoveryData = prepareTemperatureVsRecoveryData();

  if (loading) return (
    <div className={`dashboard-container ${darkMode ? 'dark-mode' : ''}`}>
      <Header />
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className={`dashboard-container ${darkMode ? 'dark-mode' : ''}`}>
      <Header />
      <div className="error-container">
        <p className="error-message">Error: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    </div>
  );

  return (
    <div className={`dashboard-container ${darkMode ? 'dark-mode' : ''}`}>
      <Header />
      
      {window.location.search.includes('debug=true') && (
        <div className="debug-panel" style={{ 
          margin: '10px', 
          padding: '10px', 
          border: '1px solid #ccc', 
          borderRadius: '5px',
          backgroundColor: darkMode ? '#333' : '#f5f5f5'
        }}>
          <h3>Debug Tools</h3>
          <p>Click on a data source to view the raw JSON:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {[
              'weather_cleaned.json',
              'cane_cleaned.json',
              'sugcs.json',
              'sugcs2.json',
              'tempdiff.json',
              'tempdiff2.json',
              'crushDateRecovery.json',
              'dateWithAge.json'
            ].map(file => (
              <a 
                key={file}
                href={`https://aigokul.hysteresis.in/${file}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '5px 10px',
                  backgroundColor: darkMode ? '#555' : '#ddd',
                  color: darkMode ? '#fff' : '#333',
                  borderRadius: '3px',
                  textDecoration: 'none'
                }}
              >
                {file}
              </a>
            ))}
          </div>
        </div>
      )}
      
      <div className="dashboard-content">
        <div className="dashboard-welcome">
          <h1>Cane & Weather Analytics</h1>
          <p>Comprehensive insights into sugar cane production and weather patterns</p>
        </div>
        
        <div className={`dashboard-grid ${expandedChart ? 'expanded-view' : ''}`}>
          <ChartCard 
            title="Rainfall Over Time" 
            isExpanded={expandedChart === 'rainfall'} 
            onToggleExpand={() => toggleExpand('rainfall')}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weatherData}
                margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#555" : "#ddd"} />
                <XAxis 
                  dataKey="Date" 
                  tick={{ fill: darkMode ? '#eee' : '#333' }}
                  tickFormatter={(value) => {
                    if (typeof value === 'string' && value.includes('T')) {
                      return value.split('T')[0].slice(5);
                    }
                    return value;
                  }}
                />
                <YAxis 
                  label={{ 
                    value: 'Rainfall (mm)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fill: darkMode ? '#eee' : '#333' }
                  }} 
                  tick={{ fill: darkMode ? '#eee' : '#333' }}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value, name) => {
                    return [typeof value === 'number' ? value.toFixed(2) : 'N/A', name];
                  }}
                  labelFormatter={(value, payload) => {
                    if (payload && payload.length > 0) {
                      return `Date: ${payload[0].payload.date}`;
                    }
                    return value;
                  }}
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#eee' : '#333',
                    border: darkMode ? '1px solid #555' : '1px solid #ddd'
                  }}
                />
                <Legend wrapperStyle={{ color: darkMode ? '#eee' : '#333' }} />
                <Line
                  type="monotone"
                  dataKey="Rain fall"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                  name="Rainfall"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard 
            title="Cane Type Proportion" 
            isExpanded={expandedChart === 'caneType'} 
            onToggleExpand={() => toggleExpand('caneType')}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={expandedChart === 'caneType' ? 180 : 100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => {
                    return typeof value === 'number' ? `${value.toFixed(2)}` : 'N/A';
                  }} 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#333' : '#fff',
                    color: darkMode ? '#eee' : '#333',
                    border: darkMode ? '1px solid #555' : '1px solid #ddd'
                  }}
                />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ color: darkMode ? '#eee' : '#333' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard 
            title="Registered vs Unregistered" 
            isExpanded={expandedChart === 'registration'} 
            onToggleExpand={() => toggleExpand('registration')}
          >
            <ResponsiveContainer width="100%" height="100%">
              {registrationData.length > 0 ? (
                <PieChart>
                  <Pie
                    data={registrationData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={expandedChart === 'registration' ? 180 : 100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {registrationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => {
                      return typeof value === 'number' ? `${value.toFixed(2)}` : 'N/A';
                    }} 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#333' : '#fff',
                      color: darkMode ? '#eee' : '#333',
                      border: darkMode ? '1px solid #555' : '1px solid #ddd'
                    }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ color: darkMode ? '#eee' : '#333' }}
                  />
                </PieChart>
              ) : (
                <div className="no-data-message">
                  <p>No registered/unregistered data available in the dataset</p>
                </div>
              )}
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard 
            title="Sugar Varieties Distribution" 
            isExpanded={expandedChart === 'varieties'} 
            onToggleExpand={() => toggleExpand('varieties')}
          >
            <ResponsiveContainer width="100%" height="100%">
              {sugarVarietiesData.length > 0 ? (
                <PieChart>
                  <Pie
                    data={sugarVarietiesData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={expandedChart === 'varieties' ? 180 : 100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sugarVarietiesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, entry) => {
                      return [typeof value === 'number' ? `${value.toFixed(2)}` : 'N/A', 
                             entry && entry.payload ? entry.payload.fullName : name];
                    }}
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#333' : '#fff',
                      color: darkMode ? '#eee' : '#333',
                      border: darkMode ? '1px solid #555' : '1px solid #ddd'
                    }}
                  />
                  <Legend 
                    formatter={(value, entry) => entry.payload.fullName}
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ color: darkMode ? '#eee' : '#333' }}
                  />
                </PieChart>
              ) : (
                <div className="no-data-message">
                  <p>No sugar variety data (MSV, HSV, LSV) available in the dataset</p>
                </div>
              )}
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard 
            title="Recovery % Over Time" 
            isExpanded={expandedChart === 'recoveryTime'} 
            onToggleExpand={() => toggleExpand('recoveryTime')}
          >
            <ResponsiveContainer width="100%" height="100%">
              {recoveryOverTimeData.length > 0 ? (
                <LineChart
                  data={recoveryOverTimeData}
                  margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#555" : "#ddd"} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: darkMode ? '#eee' : '#333' }}
                    tickFormatter={(value) => {
                      if (typeof value === 'string' && value.includes('T')) {
                        return value.split('T')[0].slice(5);
                      } else if (typeof value === 'string' && value.length > 5) {
                        return value.slice(5);
                      }
                      return value;
                    }}
                  />
                  <YAxis 
                    label={{ 
                      value: 'Recovery %', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fill: darkMode ? '#eee' : '#333' }
                    }} 
                    tick={{ fill: darkMode ? '#eee' : '#333' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#333' : '#fff',
                      color: darkMode ? '#eee' : '#333',
                      border: darkMode ? '1px solid #555' : '1px solid #ddd'
                    }}
                    formatter={(value) => {
                      return [typeof value === 'number' ? `${value.toFixed(2)}%` : 'N/A', 'Recovery'];
                    }}
                  />
                  <Legend wrapperStyle={{ color: darkMode ? '#eee' : '#333' }} />
                  <Line
                    type="monotone"
                    dataKey="recovery"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                    name="Recovery %"
                    strokeWidth={2}
                  />
                </LineChart>
              ) : (
                <div className="no-data-message">
                  <p>No recovery time-series data available in the dataset</p>
                </div>
              )}
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Comprehensive Cane Analysis"
            expanded={expandedChart === 'comprehensiveCane'}
            onToggleExpand={() => toggleExpand('comprehensiveCane')}
          >
            {comprehensiveCaneData.length > 0 ? (
              <ResponsiveContainer width="100%" height={expandedChart === 'comprehensiveCane' ? 500 : 250}>
                <ComposedChart
                  data={comprehensiveCaneData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 50
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    yAxisId="left"
                    label={{ value: 'Cane (Tons)', angle: -90, position: 'insideLeft' }} 
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    label={{ value: 'Recovery %', angle: -90, position: 'insideRight' }}
                    domain={[0, 'auto']}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (typeof value !== 'number') return ['N/A', name];
                      if (name === 'recovery') return [value.toFixed(2) + '%', 'Recovery %'];
                      return [value.toFixed(2) + ' tons', name];
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="ownCane" name="Registered (Own) Cane" fill="#0088FE" stackId="a" />
                  <Bar yAxisId="left" dataKey="unregisteredCane" name="Unregistered Cane" fill="#00C49F" stackId="a" />
                  <Bar yAxisId="left" dataKey="divInFromSemmedu" name="Div In From Semmedu" fill="#FFBB28" stackId="a" />
                  <Line yAxisId="left" type="monotone" dataKey="totalCane" name="Total Cane" stroke="#8884d8" dot={true} activeDot={{ r: 8 }} />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="recovery" 
                    name="Recovery %" 
                    stroke="#FF0000" 
                    strokeWidth={2}
                    dot={{ stroke: '#FF0000', fill: '#fff', r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data-message">No comprehensive cane data available</div>
            )}
          </ChartCard>

          <ChartCard
            title="Temp Diff vs Recovery vs Rainfall"
            expanded={expandedChart === 'tempDiffRecoveryRainfall'}
            onToggleExpand={() => toggleExpand('tempDiffRecoveryRainfall')}
          >
            <ResponsiveContainer width="100%" height={400}>
              {tempDiffRecoveryRainfallData.length > 0 ? (
                <ComposedChart
                  data={tempDiffRecoveryRainfallData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 30
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#555" : "#f5f5f5"} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: darkMode ? '#eee' : '#333' }}
                    tickFormatter={(value) => {
                      const dateParts = value.split('-');
                      if (dateParts.length === 3) {
                        return `${dateParts[1]}/${dateParts[2]}`;
                      }
                      return value;
                    }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    yAxisId="left" 
                    label={{ value: 'Recovery %', angle: -90, position: 'insideLeft', style: { fill: darkMode ? '#eee' : '#333' } }}
                    tick={{ fill: darkMode ? '#eee' : '#333' }}
                    domain={['auto', 'auto']}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    label={{ value: 'Temp (°C) / Rain (mm)', angle: -90, position: 'insideRight', style: { fill: darkMode ? '#eee' : '#333' } }}
                    tick={{ fill: darkMode ? '#eee' : '#333' }}
                    domain={[0, 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: darkMode ? '#333' : '#fff', color: darkMode ? '#eee' : '#333', border: darkMode ? '1px solid #555' : '1px solid #ddd' }}
                    formatter={(value, name) => {
                      if (typeof value !== 'number') return ['N/A', name];
                      if (name === 'recovery') return [value.toFixed(3) + '%', 'Recovery %'];
                      if (name === 'maxTemp') return [value.toFixed(1) + '°C', 'Max Temp'];
                      if (name === 'minTemp') return [value.toFixed(1) + '°C', 'Min Temp'];
                      if (name === 'tempDiff') return [value.toFixed(1) + '°C', 'Temp Diff'];
                      if (name === 'rainfall') return [value ? value.toFixed(1) + 'mm' : 'N/A', 'Rainfall'];
                      if (name === 'humidity') return [value.toFixed(1) + '%', 'Humidity'];
                      return [value, name];
                    }}
                    labelFormatter={(value) => `Date: ${value}`}
                  />
                  <Legend wrapperStyle={{ color: darkMode ? '#eee' : '#333' }} />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="recovery" 
                    stroke="#8884d8" 
                    name="recovery" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="maxTemp" 
                    stroke="#e74c3c" 
                    name="maxTemp" 
                    strokeWidth={2}
                    dot={{ stroke: '#e74c3c', fill: '#fff', r: 2 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="minTemp" 
                    stroke="#3498db" 
                    name="minTemp" 
                    strokeWidth={2}
                    dot={{ stroke: '#3498db', fill: '#fff', r: 2 }}
                    activeDot={{ r: 6 }}
                  />
                  <Bar 
                    yAxisId="right" 
                    dataKey="tempDiff" 
                    fill="#413ea0" 
                    name="tempDiff" 
                    barSize={10} 
                    opacity={0.6}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="rainfall" 
                    stroke="#FF8042" 
                    name="Rainfall" 
                    strokeWidth={3} 
                    dot={{ stroke: '#FF8042', fill: '#fff', r: 4 }} 
                    activeDot={{ r: 7 }}
                  />
                </ComposedChart>
              ) : (
                <div className="no-data-message">
                  <p>No matching temperature differential vs recovery vs rainfall data available</p>
                  <p>Check the date ranges in your JSON files</p>
                </div>
              )}
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Cane Age vs Recovery by Variety"
            expanded={expandedChart === 'caneAgeVsRecovery'}
            onToggleExpand={() => toggleExpand('caneAgeVsRecovery')}
          >
            {(() => {
              const filteredData = caneAgeVsRecoveryData.filter(item => 
                item.ageCategory === selectedAgeCategory
              );
              
              const groupedByDate = {};
              filteredData.forEach(item => {
                if (!groupedByDate[item.date]) {
                  let recoveryValue = item.totalRecovery || 0;
                  
                  const matchingRecoveryData = crushDateRecoveryData.find(
                    recoveryItem => recoveryItem["Crushing Date"].split(' ')[0] === item.date
                  );
                  
                  if (matchingRecoveryData && matchingRecoveryData["Recovery %"]) {
                    recoveryValue = parseFloat(matchingRecoveryData["Recovery %"]);
                  }
                  
                  groupedByDate[item.date] = {
                    date: item.date,
                    HSV: item.HSV || 0,
                    MSV: item.MSV || 0, 
                    Other: item.Other || 0,
                    HSVRecovery: item.HSVRecovery || 0,
                    MSVRecovery: item.MSVRecovery || 0,
                    OtherRecovery: item.OtherRecovery || 0,
                    totalRecovery: recoveryValue
                  };
                }
              });
              
              const chartData = Object.values(groupedByDate).sort((a, b) => 
                new Date(a.date) - new Date(b.date)
              );
              
              chartData.forEach(item => {
                if (item.HSV === 0) item.HSV = 0.01;
                if (item.MSV === 0) item.MSV = 0.01;
                if (item.Other === 0) item.Other = 0.01;
              });
              
              return (
                <>
                  <div className="chart-filters" style={{ marginBottom: '15px', padding: '5px 15px' }}>
                    <label style={{ marginRight: '10px', color: darkMode ? '#fff' : '#333' }}>Cane Age: </label>
                    <select 
                      value={selectedAgeCategory} 
                      onChange={(e) => setSelectedAgeCategory(e.target.value)}
                      style={{ 
                        padding: '5px 10px', 
                        borderRadius: '4px', 
                        border: darkMode ? '1px solid #555' : '1px solid #ccc',
                        backgroundColor: darkMode ? '#333' : '#fff',
                        color: darkMode ? '#fff' : '#333'
                      }}
                    >
                      <option value=">12">&gt;12 months</option>
                      <option value="12 month">12 months</option>
                      <option value="11 months">11 months</option>
                      <option value="10 months">10 months</option>
                      <option value="<10 months">&lt;10 months</option>
                    </select>
                  </div>
                  
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={360}>
                      <ComposedChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#555' : '#ccc'} />
                        <XAxis 
                          dataKey="date" 
                          label={{ 
                            value: 'Date', 
                            position: 'insideBottom', 
                            offset: -5,
                            style: { fill: darkMode ? '#fff' : '#333' }
                          }}
                          tick={{ fill: darkMode ? '#fff' : '#333', angle: -45, textAnchor: 'end' }}
                          height={60}
                        />
                        <YAxis
                          yAxisId="left"
                          label={{ 
                            value: 'Recovery Contribution %', 
                            angle: -90,
                            position: 'insideLeft',
                            style: { fill: darkMode ? '#fff' : '#333' }  
                          }}
                          tick={{ fill: darkMode ? '#fff' : '#333' }}
                          domain={[0, 'auto']}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          label={{
                            value: 'Recovery %', 
                            angle: 90,
                            position: 'insideRight',
                            style: { fill: darkMode ? '#88f' : '#33c' }  
                          }}
                          tick={{ fill: darkMode ? '#88f' : '#33c' }}
                          domain={[0, 'auto']}
                        />
                        <Tooltip 
                          formatter={(value, name, props) => {
                            if (value <= 0.01) return [0, name];
                            
                            switch(name) {
                              case 'HSV': return [`${value}%`, 'HSV Recovery Contribution'];
                              case 'MSV': return [`${value}%`, 'MSV Recovery Contribution'];
                              case 'Other': return [`${value}%`, 'Other Recovery Contribution'];
                              case 'HSVRecovery': return [`${value}%`, 'HSV Recovery Value'];
                              case 'MSVRecovery': return [`${value}%`, 'MSV Recovery Value'];
                              case 'OtherRecovery': return [`${value}%`, 'Other Recovery Value'];
                              case 'totalRecovery': return [`${value}%`, 'Total Recovery'];
                              default: return [value, name];
                            }
                          }}
                          labelFormatter={(value, payload) => {
                            if (payload && payload.length > 0 && payload[0].payload) {
                              const data = payload[0].payload;
                              const totalRecovery = data.totalRecovery !== undefined ? data.totalRecovery : "N/A";
                              
                              const recoveryDisplay = typeof totalRecovery === 'number' 
                                ? `${totalRecovery.toFixed(2)}%` 
                                : totalRecovery;
                              
                              return `Date: ${data.date} | Age: ${selectedAgeCategory} | Total Recovery: ${recoveryDisplay}`;
                            }
                            return `Date: ${value}`;
                          }}
                          contentStyle={{ backgroundColor: darkMode ? '#333' : '#fff', color: darkMode ? '#fff' : '#333' }}
                        />
                        <Legend />
                        <Bar 
                          yAxisId="left"
                          dataKey="HSV" 
                          name="HSV" 
                          fill="#8884d8" 
                          barSize={25}
                          stackId="stack"
                        />
                        <Bar 
                          yAxisId="left"
                          dataKey="MSV" 
                          name="MSV" 
                          fill="#82ca9d" 
                          barSize={25}
                          stackId="stack"
                        />
                        <Bar 
                          yAxisId="left"
                          dataKey="Other" 
                          name="Other" 
                          fill="#ffc658" 
                          barSize={25}
                          stackId="stack"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="totalRecovery"
                          name="Total Recovery"
                          stroke="#FF0000"
                          strokeWidth={2}
                          dot={{ stroke: '#FF0000', fill: '#fff', r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="no-data-message" style={{ textAlign: 'center', padding: '40px 0' }}>
                      <p>No data available for the selected age category. Please select a different category.</p>
                    </div>
                  )}
                </>
              );
            })()}
          </ChartCard>

          <div className="chart card">
            <h3>Rainfall vs Recovery %</h3>
            {rainfallVsRecoveryData.length > 0 ? (
              <ScatterChart
                width={500}
                height={300}
                margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
              >
                <CartesianGrid />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Rainfall" 
                  unit="mm" 
                  label={{ value: 'Rainfall (mm)', position: 'insideBottomRight', offset: -5 }} 
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Recovery" 
                  unit="%" 
                  label={{ value: 'Recovery %', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  formatter={(value, name) => [value, name === 'x' ? 'Rainfall (mm)' : 'Recovery %']}
                  labelFormatter={(label) => `Date: ${rainfallVsRecoveryData[label]?.date || ''}`}
                />
                <Scatter 
                  name="Rainfall vs Recovery" 
                  data={rainfallVsRecoveryData} 
                  fill="#8884d8" 
                  shape="circle" 
                />
              </ScatterChart>
            ) : (
              <div className="no-data-message">
                Processing data... If no chart appears, check console for details.
              </div>
            )}
          </div>

          <div className="chart card">
            <h3>Max Temperature vs Recovery %</h3>
            {temperatureVsRecoveryData.length > 0 ? (
              <LineChart
                width={500}
                height={300}
                data={temperatureVsRecoveryData}
                margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  label={{ value: 'Date', position: 'insideBottomRight', offset: -5 }}
                />
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  label={{ value: 'Max Temperature (°C)', angle: -90, position: 'insideLeft' }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  domain={[8, 12]}
                  label={{ value: 'Recovery %', angle: -90, position: 'insideRight' }}
                />
                <Tooltip formatter={(value, name) => {
                  if (name === 'temperature') return [`${value} °C`, 'Max Temperature'];
                  if (name === 'recovery') return [`${value} %`, 'Recovery'];
                  return [value, name];
                }}/>
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#ff7300" 
                  activeDot={{ r: 8 }} 
                  name="Max Temperature" 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="recovery" 
                  stroke="#387908" 
                  activeDot={{ r: 8 }} 
                  name="Recovery %" 
                />
              </LineChart>
            ) : (
              <div className="no-data-message">
                Processing data... If no chart appears, check console for details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;