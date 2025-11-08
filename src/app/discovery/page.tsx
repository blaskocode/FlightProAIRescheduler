import { DiscoveryFlightBookingForm } from '@/components/discovery/DiscoveryFlightBookingForm';

export default function DiscoveryFlightPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 pb-20 md:pb-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4">Book a Discovery Flight</h1>
          <p className="text-base md:text-lg text-gray-600">
            Experience the thrill of flying with a certified flight instructor. No experience required!
          </p>
        </div>
        <DiscoveryFlightBookingForm />
      </div>
    </div>
  );
}

