import { useState } from "react";

import { AxiosError } from "axios";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { useAdminRegister } from "@/hooks/queries/useAdminAuth";

import { RegisterResponse, RegisterRequest } from "@/types/admin";

export default function AdminMember() {
  const [viewPassword, setViewPassword] = useState<boolean>(false);
  const [formData, setFormData] = useState<RegisterRequest>({ loginId: "", password: "" });

  const onSuccess = (data: RegisterResponse) => {
    alert(`관리자 등록 성공: ${data.message}`);
    setFormData({ loginId: "", password: "" });
  };

  const onError = (error: AxiosError) => {
    alert(`관리자 등록 실패: ${error.response?.data || error.message}`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, name: string) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const { mutate } = useAdminRegister(onSuccess, onError);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutate(formData);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center ">
      <Card className="shadow absolute top-[50%] transform -translate-y-1/2">
        <CardHeader>
          <CardTitle>관리자 계정 생성</CardTitle>
          <CardDescription>새로운 관리자 계정을 생성합니다.</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} autoCapitalize="off" autoCorrect="off" className="w-[30rem]">
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="R-ID">ID</Label>
              <Input
                type="text"
                autoComplete="off"
                id="R-ID"
                value={formData.loginId}
                onChange={(e) => handleChange(e, "loginId")}
                className="appearance-none"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </div>
            <div className="flex flex-col gap-2 relative">
              <Label htmlFor="R-Password">Password</Label>
              <Input
                type={viewPassword ? "text" : "password"}
                id="R-Password"
                autoComplete="off"
                value={formData.password}
                onChange={(e) => handleChange(e, "password")}
                className="appearance-none"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              <Switch id="airplane-mode" onCheckedChange={setViewPassword} className="absolute right-1 bottom-2" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit">가입</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
