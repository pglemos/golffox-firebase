import React from 'react';
import { MOCK_ALERTS } from '../constants';
import type { Alert } from '../types';
import { AlertType } from '../types';
import { BellIcon, ExclamationCircleIcon, InformationCircleIcon } from './icons/Icons';

const getAlertStyles = (type: AlertType) => {
  switch (type) {
    case AlertType.Critical:
      return {
        bgColor: 'bg-golffox-red/10',
        borderColor: 'border-golffox-red',
        iconColor: 'text-golffox-red',
        icon: <ExclamationCircleIcon className="h-8 w-8" />
      };
    case AlertType.Warning:
      return {
        bgColor: 'bg-golffox-yellow/20',
        borderColor: 'border-golffox-yellow',
        iconColor: 'text-golffox-yellow',
        icon: <BellIcon className="h-8 w-8" />
      };
    case AlertType.Info:
      return {
        bgColor: 'bg-golffox-blue-light/10',
        borderColor: 'border-golffox-blue-light',
        iconColor: 'text-golffox-blue-light',
        icon: <InformationCircleIcon className="h-8 w-8" />
      };
    default:
        return {
        bgColor: 'bg-golffox-gray-light',
        borderColor: 'border-golffox-gray-medium',
        iconColor: 'text-golffox-gray-medium',
        icon: <InformationCircleIcon className="h-8 w-8" />
      };
  }
};


const AlertCard: React.FC<{ alert: Alert }> = ({ alert }) => {
    const styles = getAlertStyles(alert.type);
    return (
        <div className={`bg-white rounded-lg shadow-md p-5 flex items-start space-x-4 border-l-4 ${styles.borderColor} ${styles.bgColor}`}>
            <div className={`flex-shrink-0 ${styles.iconColor}`}>
                {styles.icon}
            </div>
            <div className="flex-grow">
                <h3 className="font-bold text-lg text-golffox-gray-dark">{alert.title}</h3>
                <p className="text-golffox-gray-medium">{alert.message}</p>
                <p className="text-xs text-golffox-gray-medium/70 mt-2">{alert.timestamp}</p>
            </div>
        </div>
    );
};


const Alerts: React.FC = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold text-golffox-gray-dark mb-6">Sistema de Alertas</h2>
      <div className="space-y-4">
        {MOCK_ALERTS
            .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map(alert => <AlertCard key={alert.id} alert={alert} />)
        }
      </div>
    </div>
  );
};

export default Alerts;