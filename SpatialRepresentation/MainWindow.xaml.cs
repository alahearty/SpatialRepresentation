using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using Microsoft.Web.WebView2.Core;
using SpatialRepresentation.Models;
using Newtonsoft.Json.Linq;

namespace SpatialRepresentation
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        private SpatialDataManager _dataManager;
        private bool _isMapLoaded = false;
        private bool _jsMapReady = false; // Add this flag
        public MainWindow()
        {
            InitializeComponent();

            InitializeDataManager();
            InitializeWebView();
        }
        /// <summary>
        /// Initialize the spatial data manager
        /// </summary>
        private void InitializeDataManager()
        {
            _dataManager = new SpatialDataManager();
            UpdateStatus("Data manager initialized");
        }

        // Helper method to send wells to WebView for modal dropdowns
        private void SendWellsToWebView()
        {
            var wells = _dataManager.GetAllWells()
                .Select(w => new { id = w.Id, name = w.Name }) // Only send Id and Name
                .ToList();
            var wellsJson = Newtonsoft.Json.JsonConvert.SerializeObject(wells);
            webView.CoreWebView2.PostWebMessageAsJson(wellsJson);
        }

        /// <summary>
        /// Initialize the WebView2 control
        /// </summary>
        private async void InitializeWebView()
        {
            try
            {
                await webView.EnsureCoreWebView2Async();

                // Set up message handler for communication with JavaScript
                webView.CoreWebView2.WebMessageReceived += CoreWebView2_WebMessageReceived;

                // Load the map HTML file
                var mapPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Resources", "index.html");
                if (File.Exists(mapPath))
                {
                    UpdateStatus($"Loading map from: {mapPath}");
                    webView.CoreWebView2.Navigate($"file:///{mapPath.Replace("\\", "/")}");
                    UpdateStatus("Loading map...");
                }
                else
                {
                    UpdateStatus("Error: index.html not found");
                }
            }
            catch (Exception ex)
            {
                UpdateStatus($"Error initializing WebView: {ex.Message}");
            }
        }

        /// <summary>
        /// Handle messages from JavaScript
        /// </summary>
        private void CoreWebView2_WebMessageReceived(object sender, CoreWebView2WebMessageReceivedEventArgs e)
        {
            try
            {
                var message = e.TryGetWebMessageAsString();
                UpdateStatus($"Message from map: {message}");

                // Robust handshake: Only send data after MAP_READY
                if (message == "MAP_READY")
                {
                    _jsMapReady = true;
                    LoadDataToMap();
                    SendWellsToWebView();
                    return;
                }

                // Handle different message types
                if (message.StartsWith("ROUTE_REQUEST:"))
                {
                    HandleRouteRequest(message);
                }
                else if (message.StartsWith("WELL_SELECTED:"))
                {
                    HandleWellSelection(message);
                }
                else if (message == "REQUEST_WELLS_LIST")
                {
                    // JS requests the latest wells list
                    SendWellsToWebView();
                }
            }
            catch (Exception ex)
            {
                UpdateStatus($"Error handling message: {ex.Message}");
            }
        }

        /// <summary>
        /// Handle route requests from the map
        /// </summary>
        private void HandleRouteRequest(string message)
        {
            try
            {
                var parts = message.Split(':');
                if (parts.Length >= 4)
                {
                    var sourceWellName = parts[1];
                    var destinationWellName = parts[2];
                    var routeType = parts[3];

                    var sourceWell = _dataManager.GetWellByName(sourceWellName);
                    var destinationWell = _dataManager.GetWellByName(destinationWellName);

                    if (sourceWell != null && destinationWell != null)
                    {
                        var routeName = $"Route from {sourceWellName} to {destinationWellName} ({routeType})";
                        var route = _dataManager.CreateRoute(sourceWell.Id, destinationWell.Id, routeName);

                        // Add route metadata
                        route.Metadata = new Dictionary<string, object>
                        {
                            ["RouteType"] = routeType,
                            ["SourceWell"] = sourceWellName,
                            ["DestinationWell"] = destinationWellName,
                            ["CreatedAt"] = DateTime.Now
                        };

                        UpdateStatus($"Route created: {route.Name} (Type: {routeType})");

                        // Optionally refresh the map to show the new route
                        LoadDataToMap();
                    }
                    else
                    {
                        UpdateStatus("Error: One or both wells not found");
                    }
                }
                else
                {
                    UpdateStatus("Error: Invalid route request format");
                }
            }
            catch (Exception ex)
            {
                UpdateStatus($"Error handling route request: {ex.Message}");
            }
        }

        /// <summary>
        /// Handle well selection from the map
        /// </summary>
        private void HandleWellSelection(string message)
        {
            try
            {
                var wellName = message.Split(':')[1];
                var well = _dataManager.GetWellByName(wellName);

                if (well != null)
                {
                    UpdateStatus($"Well selected: {well.Name} ({well.Type}) - Depth: {well.Depth}m");
                }
            }
            catch (Exception ex)
            {
                UpdateStatus($"Error handling well selection: {ex.Message}");
            }
        }

        /// <summary>
        /// WebView navigation completed event
        /// </summary>
        private void WebView_NavigationCompleted(object sender, CoreWebView2NavigationCompletedEventArgs e)
        {
            if (e.IsSuccess)
            {
                _isMapLoaded = true;
                UpdateStatus("Map loaded successfully");

                // Automatically load sample data and display it on the map
                _dataManager.CreateSampleData();
                // MessageBox.Show($"Fields: {_dataManager.Fields.Count}, Wells: {_dataManager.GetAllWells().Count}", "Debug");
                // Do NOT call LoadDataToMap or SendWellsToWebView here. Wait for MAP_READY from JS.
            }
            else
            {
                UpdateStatus("Failed to load map");
            }
        }

        /// <summary>
        /// Load sample data button click handler
        /// </summary>
        private void BtnLoadSampleData_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                _dataManager.CreateSampleData();
                UpdateStatus($"Sample data loaded: {_dataManager.Fields.Count} fields, {_dataManager.GetAllWells().Count} wells");

                if (_isMapLoaded)
                {
                    LoadDataToMap();

                    // Send wells to WebView for modal dropdowns
                    SendWellsToWebView();
                }
            }
            catch (Exception ex)
            {
                UpdateStatus($"Error loading sample data: {ex.Message}");
            }
        }

        /// <summary>
        /// Refresh map button click handler
        /// </summary>
        private void BtnRefreshMap_Click(object sender, RoutedEventArgs e)
        {
            if (_isMapLoaded)
            {
                LoadDataToMap();
                UpdateStatus("Map refreshed");
            }
            else
            {
                UpdateStatus("Map not loaded yet");
            }
        }

        /// <summary>
        /// Show statistics button click handler
        /// </summary>
        private void BtnShowStatistics_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                var stats = _dataManager.GetStatistics();
                var statsText = string.Join("\n", stats.Select(kvp => $"{kvp.Key}: {kvp.Value}"));

                MessageBox.Show($"Spatial Data Statistics:\n\n{statsText}",
                    "Statistics", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (Exception ex)
            {
                UpdateStatus($"Error showing statistics: {ex.Message}");
            }
        }

        /// <summary>
        /// Test route modal button click handler
        /// </summary>
        private void BtnTestRouteModal_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                if (_isMapLoaded && webView.CoreWebView2 != null)
                {
                    // Show the route modal via JavaScript
                    webView.CoreWebView2.ExecuteScriptAsync("document.getElementById('routeModal').classList.remove('hidden');");
                    UpdateStatus("Route modal opened");
                }
                else
                {
                    UpdateStatus("Map not loaded yet");
                }
            }
            catch (Exception ex)
            {
                UpdateStatus($"Error opening route modal: {ex.Message}");
            }
        }

        /// <summary>
        /// Export data button click handler
        /// </summary>
        private void BtnExportData_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                if (_isMapLoaded && webView.CoreWebView2 != null)
                {
                    // Export data via JavaScript
                    webView.CoreWebView2.ExecuteScriptAsync("exportGeoJSON();");
                    UpdateStatus("Data export initiated");
                }
                else
                {
                    UpdateStatus("Map not loaded yet");
                }
            }
            catch (Exception ex)
            {
                UpdateStatus($"Error exporting data: {ex.Message}");
            }
        }

        /// <summary>
        /// Clear routes button click handler
        /// </summary>
        private void BtnClearRoutes_Click(object sender, RoutedEventArgs e)
        {
            try
            {
                if (_isMapLoaded && webView.CoreWebView2 != null)
                {
                    // Clear routes via JavaScript
                    webView.CoreWebView2.ExecuteScriptAsync("clearAllRoutes();");
                    UpdateStatus("Routes cleared");
                }
                else
                {
                    UpdateStatus("Map not loaded yet");
                }
            }
            catch (Exception ex)
            {
                UpdateStatus($"Error clearing routes: {ex.Message}");
            }
        }

        /// <summary>
        /// Load data to the JavaScript map
        /// </summary>
        private async void LoadDataToMap()
        {
            if (!_isMapLoaded || !_jsMapReady) return;

            try
            {
                var jsonData = _dataManager.SerializeToJson();
                var script = $"loadData({jsonData});";

                await webView.CoreWebView2.ExecuteScriptAsync(script);
                UpdateStatus($"Data loaded to map: {_dataManager.Fields.Count} fields");

                // Ensure modal event handlers are set up
                await webView.CoreWebView2.ExecuteScriptAsync("setupModalEventHandlers();");
            }
            catch (Exception ex)
            {
                UpdateStatus($"Error loading data to map: {ex.Message}");
            }
        }

        /// <summary>
        /// Update the status display
        /// </summary>
        private void UpdateStatus(string status)
        {
            // txtStatus.Text = status;
            Console.WriteLine($"Status: {status}");
        }

    }
}
