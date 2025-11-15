/**
 * Upgrade Dialog Component for LAPA-VOID Premium
 * 
 * Provides UI for upgrading from free tier to premium (Pro) tier.
 * Handles Stripe payment integration and license activation.
 */

import * as React from 'react';
import * as vscode from 'vscode';
import { featureGate } from '../premium/feature-gate.ts';

interface UpgradeDialogProps {
  onClose: () => void;
  onUpgradeComplete?: () => void;
}

export const UpgradeDialog: React.FC<UpgradeDialogProps> = ({ onClose, onUpgradeComplete }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [licenseKey, setLicenseKey] = React.useState('');
  const [showLicenseInput, setShowLicenseInput] = React.useState(false);

  const handleStripeCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      // Open Stripe checkout in browser
      // In production, this would be a proper Stripe Checkout session URL
      const checkoutUrl = 'https://checkout.stripe.com/pay/lapa-void-pro';
      
      // For now, show license input option
      vscode.env.openExternal(vscode.Uri.parse(checkoutUrl));
      
      // Show license input after payment
      setTimeout(() => {
        setShowLicenseInput(true);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleLicenseActivation = async () => {
    if (!licenseKey.trim()) {
      setError('Please enter a license key');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Parse license key (format: licenseId:activationKey)
      const [licenseId, activationKey] = licenseKey.split(':');
      
      if (!licenseId || !activationKey) {
        throw new Error('Invalid license key format. Expected: licenseId:activationKey');
      }

      // Activate license via feature gate
      const activated = await featureGate.activateLicense(licenseId, activationKey);
      
      if (activated) {
        vscode.window.showInformationMessage('License activated successfully! Premium features are now enabled.');
        onUpgradeComplete?.();
        onClose();
      } else {
        throw new Error('License activation failed. Please check your license key.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'License activation failed');
    } finally {
      setLoading(false);
    }
  };

  const licenseInfo = featureGate.getLicenseInfo();

  return (
    <div style={{ padding: '20px', fontFamily: 'var(--vscode-font-family)' }}>
      <h2 style={{ marginTop: 0 }}>Upgrade to LAPA Swarm Pro</h2>
      
      {licenseInfo.hasLicense ? (
        <div>
          <p>✅ You already have an active license!</p>
          <p>Features enabled: {licenseInfo.features.length}</p>
          {licenseInfo.expiresAt && (
            <p>Expires: {licenseInfo.expiresAt.toLocaleDateString()}</p>
          )}
          <button onClick={onClose} style={{ marginTop: '10px', padding: '8px 16px' }}>
            Close
          </button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '20px' }}>
            <h3>Free vs Pro Comparison</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--vscode-panel-border)' }}>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Feature</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Free</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Pro</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '8px' }}>Max Agents</td>
                  <td style={{ padding: '8px' }}>4</td>
                  <td style={{ padding: '8px' }}>16 (Full Helix)</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px' }}>Inference</td>
                  <td style={{ padding: '8px' }}>Local only</td>
                  <td style={{ padding: '8px' }}>Local + Cloud</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px' }}>Memory Recall</td>
                  <td style={{ padding: '8px' }}>85%</td>
                  <td style={{ padding: '8px' }}>99.5%</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px' }}>E2B Sandbox</td>
                  <td style={{ padding: '8px' }}>❌</td>
                  <td style={{ padding: '8px' }}>✅</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px' }}>Team Collaboration</td>
                  <td style={{ padding: '8px' }}>❌</td>
                  <td style={{ padding: '8px' }}>✅</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3>Pricing</h3>
            <p><strong>$12/month</strong> or <strong>$99/year</strong> (save 31%)</p>
            <p style={{ fontSize: '0.9em', color: 'var(--vscode-descriptionForeground)' }}>
              30-day money-back guarantee
            </p>
          </div>

          {error && (
            <div style={{ 
              padding: '10px', 
              marginBottom: '10px', 
              backgroundColor: 'var(--vscode-inputValidation-errorBackground)',
              color: 'var(--vscode-errorForeground)',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}

          {!showLicenseInput ? (
            <div>
              <button
                onClick={handleStripeCheckout}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  marginRight: '10px',
                  backgroundColor: 'var(--vscode-button-background)',
                  color: 'var(--vscode-button-foreground)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Processing...' : 'Upgrade to Pro ($12/month)'}
              </button>
              <button
                onClick={() => setShowLicenseInput(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: 'var(--vscode-foreground)',
                  border: '1px solid var(--vscode-button-border)',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                I already have a license key
              </button>
            </div>
          ) : (
            <div>
              <h3>Activate License</h3>
              <p style={{ fontSize: '0.9em', marginBottom: '10px' }}>
                Enter your license key (format: licenseId:activationKey)
              </p>
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="licenseId:activationKey"
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '10px',
                  backgroundColor: 'var(--vscode-input-background)',
                  color: 'var(--vscode-input-foreground)',
                  border: '1px solid var(--vscode-input-border)',
                  borderRadius: '4px'
                }}
              />
              <div>
                <button
                  onClick={handleLicenseActivation}
                  disabled={loading || !licenseKey.trim()}
                  style={{
                    padding: '10px 20px',
                    marginRight: '10px',
                    backgroundColor: 'var(--vscode-button-background)',
                    color: 'var(--vscode-button-foreground)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading || !licenseKey.trim() ? 'not-allowed' : 'pointer',
                    opacity: loading || !licenseKey.trim() ? 0.6 : 1
                  }}
                >
                  {loading ? 'Activating...' : 'Activate License'}
                </button>
                <button
                  onClick={() => {
                    setShowLicenseInput(false);
                    setLicenseKey('');
                    setError(null);
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: 'var(--vscode-foreground)',
                    border: '1px solid var(--vscode-button-border)',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px', fontSize: '0.85em', color: 'var(--vscode-descriptionForeground)' }}>
            <p>Questions? Contact us at support@lapa.ai</p>
            <p>See <a href="https://github.com/Menoxcide/Lapa/blob/main/PREMIUM_FEATURES.md">PREMIUM_FEATURES.md</a> for details.</p>
          </div>
        </>
      )}
    </div>
  );
};

