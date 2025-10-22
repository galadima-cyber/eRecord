"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Filter } from "lucide-react"

interface AttendanceRecord {
  id: string
  courseName: string
  courseCode: string
  date: string
  status: string
  checkInTime?: string
}

interface AttendanceReportProps {
  records: AttendanceRecord[]
  onExport: () => void
}

export function AttendanceReport({ records, onExport }: AttendanceReportProps) {
  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Attendance Records</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="bg-transparent">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-foreground">Course</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Check-In Time</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-4 text-foreground">
                    <div>
                      <p className="font-medium">{record.courseName}</p>
                      <p className="text-xs text-muted-foreground">{record.courseCode}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{record.date}</td>
                  <td className="py-3 px-4 text-muted-foreground">{record.checkInTime || "-"}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        record.status === "present"
                          ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300"
                          : record.status === "absent"
                            ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
                            : "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300"
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
