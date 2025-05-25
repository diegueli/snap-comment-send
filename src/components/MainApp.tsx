import React, { useState } from 'react';
import { Camera, FileText, Users, Settings, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import CameraApp from './CameraApp';

const MainApp = () => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6 bg-white shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              📱 Multi-Function App
            </CardTitle>
            <p className="text-gray-600">
              Your all-in-one mobile application
            </p>
          </CardHeader>
        </Card>

        {/* Main Menu Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {/* Camera Photo Collection Button */}
          <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-white">
                <CardContent className="p-6 text-center">
                  <Camera className="w-12 h-12 mx-auto mb-3 text-purple-600" />
                  <h3 className="font-semibold text-gray-800">Photo Collection</h3>
                  <p className="text-sm text-gray-600 mt-1">Capture & Export PDF</p>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto p-0">
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="text-center">Photo Collection</DialogTitle>
              </DialogHeader>
              <div className="p-0">
                <CameraApp onClose={() => setIsCameraOpen(false)} />
              </div>
            </DialogContent>
          </Dialog>

          {/* Other App Features */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-white">
            <CardContent className="p-6 text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Documents</h3>
              <p className="text-sm text-gray-600 mt-1">Manage Files</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-white">
            <CardContent className="p-6 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-green-600" />
              <h3 className="font-semibold text-gray-800">Contacts</h3>
              <p className="text-sm text-gray-600 mt-1">Address Book</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-white">
            <CardContent className="p-6 text-center">
              <Settings className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <h3 className="font-semibold text-gray-800">Settings</h3>
              <p className="text-sm text-gray-600 mt-1">Preferences</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-white">
            <CardContent className="p-6 text-center">
              <Home className="w-12 h-12 mx-auto mb-3 text-orange-600" />
              <h3 className="font-semibold text-gray-800">Home</h3>
              <p className="text-sm text-gray-600 mt-1">Dashboard</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Bar */}
        <Card className="bg-white shadow-lg">
          <CardContent className="p-4">
            <div className="flex justify-center space-x-4">
              <Button 
                onClick={() => setIsCameraOpen(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <Camera className="w-4 h-4 mr-2" />
                Quick Camera
              </Button>
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Recent Files
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MainApp;
