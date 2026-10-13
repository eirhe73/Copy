<?php

namespace App\Services;

use App\Models\Handover;
use Illuminate\Support\Facades\DB;

/**
 * 到院交接：写 handovers，生成交接单号
 */
class HandoverService extends Service
{
    public function store(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $handover = Handover::create([
                'handover_no' => $this->generateHandoverNo(),
                'transfer_no' => $data['transferNo'] ?? null,
                'event_id' => $data['eventId'] ?? null,
                'task120_id' => $data['task120Id'] ?? null,
                'patient_id' => $data['patientId'],
                'patient_name' => $data['patientName'],
                'from_staff_id' => $data['fromStaffId'],
                'from_staff_name' => $data['fromStaffName'],
                'to_staff_id' => $data['toStaffId'] ?? null,
                'to_staff_name' => $data['toStaffName'] ?? null,
                'to_dept' => $data['toDept'] ?? null,
                'items' => $data['items'],
                'signature' => $data['signature'] ?? '',
                'handover_at' => $data['handoverAt'] ?? now(),
            ]);

            return [
                'handoverId' => $handover->handover_no,
                'transferNo' => $handover->transfer_no ?? '',
                'signature' => $handover->signature,
            ];
        });
    }

    private function generateHandoverNo(): string
    {
        $prefix = 'HO-'.now()->format('Ymd').'-';
        $seq = (int) DB::table('handovers')->where('handover_no', 'like', $prefix.'%')->count();

        do {
            $seq++;
            $code = $prefix.str_pad((string) $seq, 3, '0', STR_PAD_LEFT);
        } while (DB::table('handovers')->where('handover_no', $code)->exists());

        return $code;
    }
}
