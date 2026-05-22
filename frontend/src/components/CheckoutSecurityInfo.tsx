import { Lock } from 'lucide-react';
import Card from './Card';

export default function CheckoutSecurityInfo() {
  return (
    <Card className="p-6 bg-linear-to-br from-primary-50 to-primary-100 border border-primary-200">
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <Lock className="w-6 h-6 text-primary-700 mt-1" />
        </div>
        <div>
          <h4 className="font-semibold text-primary-900 mb-2">Secure & Encrypted</h4>
          <p className="text-sm text-primary-700 mb-3">
            Your payment information is protected with industry-standard encryption and security protocols.
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary-700 rounded-full" />
              <span className="text-xs font-medium text-primary-700">SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary-700 rounded-full" />
              <span className="text-xs font-medium text-primary-700">PCI DSS Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary-700 rounded-full" />
              <span className="text-xs font-medium text-primary-700">Money-back Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
