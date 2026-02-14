import React from 'react';

interface DayCardProps {
  dayName: string;
  date: string;
  dateISO: string;
  hasApprovedReservations: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export const DayCard: React.FC<DayCardProps> = ({
  dayName,
  date,
  dateISO,
  hasApprovedReservations,
  isSelected,
  onClick,
}) => {
  // Classes base
  let cellClass =
    'calendar-day-cell flex flex-col items-center justify-center p-1 md:p-2 border border-gray-100 rounded text-xs md:text-sm transition-colors cursor-pointer min-h-[60px] md:min-h-[80px]';

  // Adiciona data attributes para CSS
  const dataAttrs = {
    'data-date': dateISO,
    'data-selected': isSelected ? '' : undefined,
  };

  return (
    <div
      className={cellClass}
      data-day-name={dayName}
      data-has-reservations={hasApprovedReservations ? '' : undefined}
      onClick={onClick}
      {...dataAttrs}
    >
      <span className="font-semibold text-gray-700">{dayName}</span>
      <span className="font-bold text-gray-900 md:text-base">{date}</span>
      {hasApprovedReservations && (
        <span className="text-[10px] md:text-xs text-blue-600 mt-1">reservado</span>
      )}
    </div>
  );
};
