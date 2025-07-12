// frontend/src/components/analytics/Analytics.js
import React, { useState, useEffect, useContext } from 'react';
import { DeviceContext } from '../../context/DeviceContext';
import axios from 'axios';

const Analytics = () => {
  const { devices, loading: devicesLoading, getDevices } = useContext(DeviceContext);
  const [analytics, setAnalytics] = useState({
    overview: {},
    modelAnalysis: [],
    profitAnalysis: {},
    batteryAnalysis: {},
    qualityAnalysis: {},
    timeAnalysis: {},
    purchaseMethodAnalysis: {}
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateFilter, setDateFilter] = useState('all'); // all, 30d, 90d, 1y

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const adminToken = localStorage.getItem('adminToken');
    const resellerToken = localStorage.getItem('resellerToken');
    const token = adminToken || resellerToken;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    loadAnalytics();
  }, [dateFilter]);

  useEffect(() => {
    if (devices.length === 0) {
      getDevices();
    }
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Filter devices by date if needed
      let filteredDevices = [...devices];
      if (dateFilter !== 'all') {
        const daysAgo = {
          '30d': 30,
          '90d': 90,
          '1y': 365
        }[dateFilter];
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        
        filteredDevices = devices.filter(device => 
          new Date(device.purchaseDate) >= cutoffDate
        );
      }

      // Calculate analytics
      const analyticsData = calculateAnalytics(filteredDevices);
      setAnalytics(analyticsData);
      
    } catch (error) {
      console.error('Fehler beim Laden der Analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (deviceList) => {
    // Overview Statistics
    const overview = {
      totalDevices: deviceList.length,
      soldDevices: deviceList.filter(d => d.status === 'verkauft').length,
      availableDevices: deviceList.filter(d => d.status !== 'verkauft').length,
      averagePurchasePrice: 0,
      averageSellingPrice: 0,
      totalRevenue: 0,
      totalProfit: 0,
      averageProfit: 0
    };

    if (deviceList.length > 0) {
      overview.averagePurchasePrice = deviceList.reduce((sum, d) => sum + (d.purchasePrice || 0), 0) / deviceList.length;
      
      const soldDevices = deviceList.filter(d => d.status === 'verkauft');
      if (soldDevices.length > 0) {
        // Verwende actualSellingPrice wenn vorhanden, sonst sellingPrice
        const revenues = soldDevices.map(d => d.actualSellingPrice || d.sellingPrice || 0);
        overview.totalRevenue = revenues.reduce((sum, price) => sum + price, 0);
        overview.averageSellingPrice = overview.totalRevenue / soldDevices.length;
        
        // Profit berechnen
        const profits = soldDevices.map(d => {
          const sellingPrice = d.actualSellingPrice || d.sellingPrice || 0;
          const costs = (d.purchasePrice || 0) + (d.parts || []).reduce((sum, p) => sum + (p.price || 0), 0);
          return sellingPrice - costs;
        });
        
        overview.totalProfit = profits.reduce((sum, profit) => sum + profit, 0);
        overview.averageProfit = overview.totalProfit / soldDevices.length;
      }
    }

    // Model Analysis
    const modelGroups = {};
    deviceList.forEach(device => {
      // Extrahiere Basis-Modell (ohne Farbe und Speicher)
      const baseModel = extractBaseModel(device.model || device.modelDesc || 'Unbekannt');
      
      if (!modelGroups[baseModel]) {
        modelGroups[baseModel] = {
          model: baseModel,
          totalCount: 0,
          soldCount: 0,
          averagePurchasePrice: 0,
          averageSellingPrice: 0,
          totalRevenue: 0,
          totalProfit: 0,
          averageBatteryHealth: 0,
          devices: []
        };
      }
      
      modelGroups[baseModel].devices.push(device);
      modelGroups[baseModel].totalCount++;
      
      if (device.status === 'verkauft') {
        modelGroups[baseModel].soldCount++;
      }
    });

    // Berechne Durchschnittswerte pro Modell
    const modelAnalysis = Object.values(modelGroups).map(group => {
      const { devices } = group;
      
      // Durchschnittlicher Einkaufspreis
      group.averagePurchasePrice = devices.reduce((sum, d) => sum + (d.purchasePrice || 0), 0) / devices.length;
      
      // Verkaufte Geräte analysieren
      const soldDevices = devices.filter(d => d.status === 'verkauft');
      if (soldDevices.length > 0) {
        const revenues = soldDevices.map(d => d.actualSellingPrice || d.sellingPrice || 0);
        group.totalRevenue = revenues.reduce((sum, price) => sum + price, 0);
        group.averageSellingPrice = group.totalRevenue / soldDevices.length;
        
        // Profit berechnen
        const profits = soldDevices.map(d => {
          const sellingPrice = d.actualSellingPrice || d.sellingPrice || 0;
          const costs = (d.purchasePrice || 0) + (d.parts || []).reduce((sum, p) => sum + (p.price || 0), 0);
          return sellingPrice - costs;
        });
        group.totalProfit = profits.reduce((sum, profit) => sum + profit, 0);
      }
      
      // Durchschnittliche Akkugesundheit
      const devicesWithBattery = devices.filter(d => d.batteryInfo?.health);
      if (devicesWithBattery.length > 0) {
        group.averageBatteryHealth = devicesWithBattery.reduce((sum, d) => sum + d.batteryInfo.health, 0) / devicesWithBattery.length;
      }
      
      // Verkaufsrate
      group.sellRate = group.totalCount > 0 ? (group.soldCount / group.totalCount * 100) : 0;
      
      return group;
    });

    // Sortiere nach Verkaufsvolumen
    modelAnalysis.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Profit Analysis
    const soldDevices = deviceList.filter(d => d.status === 'verkauft');
    const profitAnalysis = {
      highestProfit: 0,
      lowestProfit: 0,
      mostProfitableModel: '',
      leastProfitableModel: '',
      profitMarginDistribution: {}
    };

    if (soldDevices.length > 0) {
      const profits = soldDevices.map(d => {
        const sellingPrice = d.actualSellingPrice || d.sellingPrice || 0;
        const costs = (d.purchasePrice || 0) + (d.parts || []).reduce((sum, p) => sum + (p.price || 0), 0);
        return { device: d, profit: sellingPrice - costs };
      });

      profitAnalysis.highestProfit = Math.max(...profits.map(p => p.profit));
      profitAnalysis.lowestProfit = Math.min(...profits.map(p => p.profit));
      
      const topProfitModel = modelAnalysis.find(m => m.soldCount > 0);
      const lowProfitModel = [...modelAnalysis].reverse().find(m => m.soldCount > 0);
      
      profitAnalysis.mostProfitableModel = topProfitModel?.model || '';
      profitAnalysis.leastProfitableModel = lowProfitModel?.model || '';
    }

    // Battery Analysis
    const devicesWithBattery = deviceList.filter(d => d.batteryInfo?.health);
    const batteryAnalysis = {
      averageHealth: 0,
      healthDistribution: {},
      needsReplacementCount: 0
    };

    if (devicesWithBattery.length > 0) {
      batteryAnalysis.averageHealth = devicesWithBattery.reduce((sum, d) => sum + d.batteryInfo.health, 0) / devicesWithBattery.length;
      
      // Health distribution
      const ranges = { 'Excellent (90-100%)': 0, 'Good (80-89%)': 0, 'Fair (70-79%)': 0, 'Poor (<70%)': 0 };
      devicesWithBattery.forEach(d => {
        const health = d.batteryInfo.health;
        if (health >= 90) ranges['Excellent (90-100%)']++;
        else if (health >= 80) ranges['Good (80-89%)']++;
        else if (health >= 70) ranges['Fair (70-79%)']++;
        else ranges['Poor (<70%)']++;
        
        if (health < 80) batteryAnalysis.needsReplacementCount++;
      });
      
      batteryAnalysis.healthDistribution = ranges;
    }

    // Quality Analysis
    const qualityAnalysis = {
      gradeDistribution: {},
      averageGrade: ''
    };

    const devicesWithGrade = deviceList.filter(d => d.physicalCondition?.overallGrade);
    if (devicesWithGrade.length > 0) {
      const grades = {};
      devicesWithGrade.forEach(d => {
        const grade = d.physicalCondition.overallGrade;
        grades[grade] = (grades[grade] || 0) + 1;
      });
      qualityAnalysis.gradeDistribution = grades;
    }

    // Time Analysis
    const timeAnalysis = {
      averageSaleTime: 0,
      salesByMonth: {}
    };

    const devicesWithSaleDate = deviceList.filter(d => d.status === 'verkauft' && d.soldDate && d.purchaseDate);
    if (devicesWithSaleDate.length > 0) {
      const saleTimes = devicesWithSaleDate.map(d => {
        const purchased = new Date(d.purchaseDate);
        const sold = new Date(d.soldDate);
        return (sold - purchased) / (1000 * 60 * 60 * 24); // Tage
      });
      
      timeAnalysis.averageSaleTime = saleTimes.reduce((sum, time) => sum + time, 0) / saleTimes.length;
    }

    // Purchase Method Analysis
    const purchaseMethodAnalysis = {};
    deviceList.forEach(d => {
      const method = d.purchaseInfo?.method || 'manual';
      if (!purchaseMethodAnalysis[method]) {
        purchaseMethodAnalysis[method] = { count: 0, revenue: 0, profit: 0 };
      }
      purchaseMethodAnalysis[method].count++;
      
      if (d.status === 'verkauft') {
        const revenue = d.actualSellingPrice || d.sellingPrice || 0;
        const costs = (d.purchasePrice || 0) + (d.parts || []).reduce((sum, p) => sum + (p.price || 0), 0);
        purchaseMethodAnalysis[method].revenue += revenue;
        purchaseMethodAnalysis[method].profit += (revenue - costs);
      }
    });

    return {
      overview,
      modelAnalysis,
      profitAnalysis,
      batteryAnalysis,
      qualityAnalysis,
      timeAnalysis,
      purchaseMethodAnalysis
    };
  };

  const extractBaseModel = (fullModel) => {
    // Entferne Farben, Speichergrößen und Codes
    return fullModel
      .replace(/\s+(Black|White|Red|Blue|Green|Yellow|Purple|Pink|Starlight|Midnight|Silver|Gold|Graphite|Sierra Blue|Alpine Green|Product RED|Pacific Blue)\s+/gi, ' ')
      .replace(/\s+\d+GB\s+/gi, ' ')
      .replace(/\s+\[.*?\]/g, '')
      .replace(/\s+-\s+.*$/, '')
      .trim();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading || devicesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Analytics-Daten...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: '📊 Übersicht', icon: '📊' },
    { id: 'models', label: '📱 Modelle', icon: '📱' },
    { id: 'profits', label: '💰 Profit', icon: '💰' },
    { id: 'battery', label: '🔋 Akku', icon: '🔋' },
    { id: 'quality', label: '⭐ Qualität', icon: '⭐' },
    { id: 'time', label: '⏱️ Zeit', icon: '⏱️' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">📈 Datenanalyse</h1>
            <p className="text-gray-600 mt-1">
              Umfassende Analyse von {analytics.overview.totalDevices} Geräten
            </p>
          </div>
          
          {/* Date Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Zeitraum:</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alle Zeit</option>
              <option value="30d">Letzte 30 Tage</option>
              <option value="90d">Letzte 90 Tage</option>
              <option value="1y">Letztes Jahr</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-0 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">📱</span>
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Gesamte Geräte</p>
                        <p className="text-2xl font-bold text-blue-900">{analytics.overview.totalDevices}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">✅</span>
                      <div>
                        <p className="text-sm text-green-600 font-medium">Verkauft</p>
                        <p className="text-2xl font-bold text-green-900">{analytics.overview.soldDevices}</p>
                        <p className="text-xs text-green-600">
                          {formatPercent(analytics.overview.totalDevices > 0 ? analytics.overview.soldDevices / analytics.overview.totalDevices * 100 : 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">📦</span>
                      <div>
                        <p className="text-sm text-yellow-600 font-medium">Verfügbar</p>
                        <p className="text-2xl font-bold text-yellow-900">{analytics.overview.availableDevices}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">💰</span>
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Gesamtumsatz</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {formatCurrency(analytics.overview.totalRevenue)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">💹 Finanzübersicht</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ø Einkaufspreis:</span>
                        <span className="font-medium">{formatCurrency(analytics.overview.averagePurchasePrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ø Verkaufspreis:</span>
                        <span className="font-medium">{formatCurrency(analytics.overview.averageSellingPrice)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-600">Gesamtprofit:</span>
                        <span className="font-bold text-green-600">{formatCurrency(analytics.overview.totalProfit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ø Profit pro Gerät:</span>
                        <span className="font-bold text-green-600">{formatCurrency(analytics.overview.averageProfit)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Status Verteilung</h3>
                    <div className="space-y-2">
                      {Object.entries({
                        'verkauft': analytics.overview.soldDevices,
                        'zum_verkauf': devices.filter(d => d.status === 'zum_verkauf').length,
                        'verkaufsbereit': devices.filter(d => d.status === 'verkaufsbereit').length,
                        'in_reparatur': devices.filter(d => d.status === 'in_reparatur').length,
                        'gekauft': devices.filter(d => d.status === 'gekauft').length
                      }).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-gray-600 capitalize">{status.replace('_', ' ')}:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{count}</span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${analytics.overview.totalDevices > 0 ? (count / analytics.overview.totalDevices * 100) : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Models Tab */}
            {activeTab === 'models' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">📱 Analyse nach Modellen</h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Modell</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Anzahl</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Verkauft</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Verkaufsrate</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Ø Einkauf</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Ø Verkauf</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Gesamtumsatz</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Ø Akku</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {analytics.modelAnalysis.slice(0, 15).map((model, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{model.model}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">{model.totalCount}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">{model.soldCount}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">
                            <span className={`font-medium ${model.sellRate >= 50 ? 'text-green-600' : model.sellRate >= 25 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {formatPercent(model.sellRate)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatCurrency(model.averagePurchasePrice)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatCurrency(model.averageSellingPrice)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-green-600 text-right">{formatCurrency(model.totalRevenue)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">
                            {model.averageBatteryHealth > 0 ? (
                              <span className={`font-medium ${
                                model.averageBatteryHealth >= 85 ? 'text-green-600' : 
                                model.averageBatteryHealth >= 70 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {model.averageBatteryHealth.toFixed(0)}%
                              </span>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Weitere Tabs hier... */}
            {activeTab === 'profits' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">💰 Profit-Analyse</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">🏆 Top Performer</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Höchster Profit:</span>
                        <span className="font-bold text-green-600">{formatCurrency(analytics.profitAnalysis.highestProfit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Niedrigster Profit:</span>
                        <span className="font-bold text-red-600">{formatCurrency(analytics.profitAnalysis.lowestProfit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Profitabelste Serie:</span>
                        <span className="font-medium">{analytics.profitAnalysis.mostProfitableModel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">📈 Profit-Trends</h4>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        Gesamtprofit: <span className="font-bold text-green-600">{formatCurrency(analytics.overview.totalProfit)}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Durchschnitt pro Verkauf: <span className="font-bold">{formatCurrency(analytics.overview.averageProfit)}</span>
                      </div>
                      {analytics.overview.averageSellingPrice > 0 && (
                        <div className="text-sm text-gray-600">
                          Profit-Marge: <span className="font-bold">
                            {formatPercent((analytics.overview.averageProfit / analytics.overview.averageSellingPrice) * 100)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'battery' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">🔋 Akku-Analyse</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">📊 Gesundheits-Verteilung</h4>
                    <div className="space-y-3">
                      {Object.entries(analytics.batteryAnalysis.healthDistribution).map(([range, count]) => (
                        <div key={range} className="flex items-center justify-between">
                          <span className="text-gray-600">{range}:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{count}</span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  range.includes('Excellent') ? 'bg-green-500' :
                                  range.includes('Good') ? 'bg-blue-500' :
                                  range.includes('Fair') ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Object.values(analytics.batteryAnalysis.healthDistribution).reduce((sum, c) => sum + c, 0) > 0 ? (count / Object.values(analytics.batteryAnalysis.healthDistribution).reduce((sum, c) => sum + c, 0) * 100) : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">⚠️ Wartungsbedarf</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Durchschnittliche Gesundheit:</span>
                        <span className={`font-bold ${
                          analytics.batteryAnalysis.averageHealth >= 85 ? 'text-green-600' :
                          analytics.batteryAnalysis.averageHealth >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {analytics.batteryAnalysis.averageHealth.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Austausch empfohlen:</span>
                        <span className="font-bold text-red-600">{analytics.batteryAnalysis.needsReplacementCount} Geräte</span>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg mt-4">
                        <p className="text-sm text-yellow-800">
                          💡 <strong>Tipp:</strong> Geräte mit Akkugesundheit unter 85% sollten einen Akkutausch erhalten, um den Verkaufswert zu steigern.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'quality' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">⭐ Qualitäts-Analyse</h3>
                
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">📊 Zustand-Verteilung</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {Object.entries(analytics.qualityAnalysis.gradeDistribution).map(([grade, count]) => (
                      <div key={grade} className="text-center">
                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          grade === 'A+' ? 'bg-green-500' :
                          grade === 'A' ? 'bg-blue-500' :
                          grade === 'B' ? 'bg-yellow-500' :
                          grade === 'C' ? 'bg-orange-500' : 'bg-red-500'
                        }`}>
                          {grade}
                        </div>
                        <p className="mt-2 text-sm font-medium text-gray-900">{count} Geräte</p>
                        <p className="text-xs text-gray-600">
                          {Object.values(analytics.qualityAnalysis.gradeDistribution).reduce((sum, c) => sum + c, 0) > 0 ? 
                            `${((count / Object.values(analytics.qualityAnalysis.gradeDistribution).reduce((sum, c) => sum + c, 0)) * 100).toFixed(1)}%` : '0%'
                          }
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'time' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">⏱️ Zeit-Analyse</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">📈 Verkaufszeiten</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Durchschnittliche Verkaufszeit:</span>
                        <span className="font-bold">
                          {analytics.timeAnalysis.averageSaleTime > 0 ? 
                            `${Math.round(analytics.timeAnalysis.averageSaleTime)} Tage` : 
                            'Keine Daten'
                          }
                        </span>
                      </div>
                      
                      {analytics.timeAnalysis.averageSaleTime > 0 && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm text-blue-800">
                            📊 Im Durchschnitt werden Geräte nach {Math.round(analytics.timeAnalysis.averageSaleTime)} Tagen verkauft.
                            {analytics.timeAnalysis.averageSaleTime > 60 && 
                              " Das ist relativ lang - prüfen Sie Ihre Preisgestaltung."
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">📊 Ankaufsmethoden</h4>
                    <div className="space-y-2">
                      {Object.entries(analytics.purchaseMethodAnalysis).map(([method, data]) => (
                        <div key={method} className="flex items-center justify-between">
                          <span className="text-gray-600 capitalize">
                            {method === 'guided' ? '🛒 Strukturiert' : 
                             method === 'manual' ? '⚡ Manuell' : 
                             method === 'bulk' ? '📦 Bulk' : method}:
                          </span>
                          <div className="text-right">
                            <div className="font-medium">{data.count} Geräte</div>
                            <div className="text-sm text-green-600">{formatCurrency(data.revenue)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Export Button */}
        <div className="text-center">
          <button
            onClick={() => {
              const dataStr = JSON.stringify(analytics, null, 2);
              const dataBlob = new Blob([dataStr], {type: 'application/json'});
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
              link.click();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            📁 Analytics exportieren
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;