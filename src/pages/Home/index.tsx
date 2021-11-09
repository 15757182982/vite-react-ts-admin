import ProCard from '@ant-design/pro-card';
import { Button, Select, Statistic } from 'antd';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import RcResizeObserver from 'rc-resize-observer';
import Maps from './maps';
import {
  findPvAll,
  findPvStatistics,
  findUvAll,
  findUvStatistics,
} from './services';
import type {
  FormMonitorType,
  GlobalType,
  PvStatisticsType,
  UvStatisticsType,
} from './type';
import moment from 'moment';
import exportToExcel from '@/utils/exportToExcel';
import ProTable, { ProColumns } from '@ant-design/pro-table';

moment.locale('zh-cn');

const { Option } = Select;

const Home: React.FC = () => {
  const [responsive, setResponsive] = useState(false);
  const [uvStatistics, setUvStatistics] = useState<UvStatisticsType>();
  const [pvStatistics, setPvStatistics] = useState<PvStatisticsType>();
  const history = useHistory();

  const [globalType, setGlobalType] = useState<GlobalType>('all');

  useEffect(() => {
    const getData = async () => {
      const resUv = await findUvStatistics({ type: globalType });
      const resPv = await findPvStatistics({ type: globalType });
      setUvStatistics(resUv?.data);
      setPvStatistics(resPv?.data);
    };
    getData();
  }, [globalType]);

  const onSelect = (val: GlobalType) => {
    setGlobalType(val);
  };

  const columns: ProColumns[] = [
    {
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 48,
    },
    {
      title: '类型',
      dataIndex: 'type',
      render: (type: any) => (type === 'admin' ? '金皮卡后台' : '个人博客'),
      hideInSearch: true,
    },
    {
      title: '访客标识码',
      tip: '根据cookie生成的参数',
      hideInSearch: true,
      dataIndex: 'uid',
    },
    {
      title: 'ip',
      dataIndex: 'ip',
      hideInSearch: true,
    },
    {
      title: '访问时间',
      dataIndex: 'startTime',
      defaultSortOrder: 'descend',
      valueType: 'dateTime',
      sorter: true,
      hideInSearch: true,
    },
    {
      title: '访问时间',
      dataIndex: 'created_at',
      valueType: 'dateTimeRange',
      hideInTable: true,
      search: {
        transform: (value: any[]) => {
          return {
            startSearchTime: value[0],
            endSearchTime: value[1],
          };
        },
      },
    },
    {
      title: '访问时长',
      dataIndex: 'durationVisit',
      sorter: true,
      hideInSearch: true,
      render: (text) =>
        `${
          moment(Number(text)).locale() === 'en'
            ? new Date(Number(text)).getHours() - 8
            : new Date(Number(text)).getHours()
        }:${moment(Number(text)).format('mm:ss')}`,
    },
  ];

  const pvColumns: ProColumns[] = [
    {
      title: '访问路由',
      dataIndex: 'pathname',
    },
  ];

  const uvColumns: ProColumns[] = [
    {
      title: '访问结束时间',
      dataIndex: 'endTime',
      valueType: 'dateTime',
      sorter: true,
      hideInSearch: true,
    },
    {
      title: '地域',
      dataIndex: 'address',
    },
  ];

  return (
    <>
      <ProCard>
        <Button
          onClick={() => {
            history.push('/manager/menu');
          }}
        >
          菜单管理
        </Button>
        <Select
          defaultValue="all"
          style={{ width: 150, marginLeft: 20 }}
          onSelect={onSelect}
        >
          <Option value="all">全部</Option>
          <Option value="admin">金皮卡后台(admin)</Option>
          <Option value="blog">个人博客(blog)</Option>
        </Select>
      </ProCard>
      <RcResizeObserver
        key="resize-observer"
        onResize={(offset) => {
          setResponsive(offset.width < 596);
        }}
      >
        <ProCard
          style={{ marginTop: 8 }}
          ghost
          gutter={8}
          split={responsive ? 'horizontal' : 'vertical'}
        >
          <ProCard
            split="horizontal"
            colSpan={{ xs: 24, sm: 12, md: 12, lg: 10, xl: 10 }}
          >
            <ProCard split="horizontal">
              <ProCard split={responsive ? 'horizontal' : 'vertical'}>
                <ProCard title="总访问量(UV)">
                  <Statistic value={uvStatistics?.uvTotal || 0} />
                </ProCard>
                <ProCard title="总流量(PV)">
                  <Statistic value={pvStatistics?.pvTotal || 0} />
                </ProCard>
              </ProCard>
              <ProCard split={responsive ? 'horizontal' : 'vertical'}>
                <ProCard title="昨日全部流量(PV)">
                  {pvStatistics?.pvLastDay || 0}
                </ProCard>
                <ProCard title="本月累计流量(PV)">
                  {pvStatistics?.pvThisMonth || 0}
                </ProCard>
                <ProCard title="今年累计流量(PV)">
                  {pvStatistics?.pvThisYear || 0}
                </ProCard>
              </ProCard>
              <ProCard split="vertical">
                <ProCard title="历史峰值(PV)">
                  <Statistic value={pvStatistics?.pvPeak || 0} />
                </ProCard>
                <ProCard title="平均访问时长(UV)">
                  {uvStatistics?.uvAverageTime
                    ? `${
                        moment(Number(uvStatistics?.uvAverageTime)).locale() ===
                        'en'
                          ? new Date(
                              Number(uvStatistics?.uvAverageTime),
                            ).getHours() - 8
                          : new Date(
                              Number(uvStatistics?.uvAverageTime),
                            ).getHours()
                      }:${moment(Number(uvStatistics?.uvAverageTime)).format(
                        'mm:ss',
                      )}`
                    : '00:00:00'}
                </ProCard>
              </ProCard>
            </ProCard>
            <ProCard title="流量趋势">
              <div>图表</div>
              <div>图表</div>
              <div>图表</div>
              <div>图表</div>
              <div>图表</div>
            </ProCard>
          </ProCard>
          <ProCard title="地域分布情况">
            <Maps globalType={globalType} />
          </ProCard>
        </ProCard>
      </RcResizeObserver>
      <ProTable<FormMonitorType>
        style={{ marginTop: '20px' }}
        scroll={{ x: true }}
        bordered
        params={{ type: globalType }}
        request={async (params, sorter, filter) => {
          // 这里需要返回一个 Promise,在返回之前你可以进行数据转化
          // 如果需要转化参数可以在这里进行修改
          const msg = await findPvAll({
            ...params,
            ...sorter,
            ...filter,
          });
          console.log(msg);

          if (msg) {
            return {
              data: msg.data,
              success: true,
              total: msg?.total,
            };
          }
          return {
            data: undefined,
            // success 请返回 true，
            // 不然 table 会停止解析数据，即使有数据
            success: false,
            // 不传会使用 data 的长度，如果是分页一定要传
            total: 0,
          };
        }}
        columns={[...columns, ...pvColumns]}
        editable={{
          type: 'multiple',
        }}
        columnsState={{
          persistenceKey: 'pro-table-singe-demos',
          persistenceType: 'localStorage',
        }}
        rowKey="id"
        search={{
          labelWidth: 'auto',
          filterType: 'light',
        }}
        form={{
          // 由于配置了 transform，提交的参与与定义的不同这里需要转化一下
          syncToUrl: (values: any, type: string) => {
            if (type === 'get') {
              return {
                ...values,
                created_at: [values.startSearchTime, values.endSearchTime],
              };
            }
            return values;
          },
        }}
        pagination={{
          pageSize: 10,
          pageSizeOptions: ['10', '20', '30', '50', '100'],
        }}
        dateFormatter="string"
        headerTitle="流量监控"
        toolBarRender={() => [
          <Button
            key="out"
            // onClick={() => {
            //   exportToExcel(datasSource, '流量监控');
            // }}
          >
            导出数据
          </Button>,
        ]}
      />
      <ProTable<FormMonitorType>
        style={{ marginTop: '20px' }}
        scroll={{ x: true }}
        bordered
        params={{ type: globalType }}
        request={async (params, sorter, filter) => {
          // 这里需要返回一个 Promise,在返回之前你可以进行数据转化
          // 如果需要转化参数可以在这里进行修改
          const msg = await findUvAll({
            ...params,
            ...sorter,
            ...filter,
          });
          console.log(msg);

          if (msg) {
            return {
              data: msg?.data,
              success: true,
              total: msg?.total,
            };
          }
          return {
            data: undefined,
            // success 请返回 true，
            // 不然 table 会停止解析数据，即使有数据
            success: false,
            // 不传会使用 data 的长度，如果是分页一定要传
            total: 0,
          };
        }}
        columns={[...columns, ...uvColumns]}
        editable={{
          type: 'multiple',
        }}
        columnsState={{
          persistenceKey: 'pro-table-singe-demos',
          persistenceType: 'localStorage',
        }}
        rowKey="id"
        search={{
          labelWidth: 'auto',
          filterType: 'light',
        }}
        form={{
          // 由于配置了 transform，提交的参与与定义的不同这里需要转化一下
          syncToUrl: (values: any, type: string) => {
            if (type === 'get') {
              return {
                ...values,
                created_at: [values.startSearchTime, values.endSearchTime],
              };
            }
            return values;
          },
        }}
        pagination={{
          pageSize: 5,
          pageSizeOptions: ['5', '10', '20', '30', '50', '100'],
        }}
        dateFormatter="string"
        headerTitle="访问量监控"
        toolBarRender={() => [
          <Button
            key="out"
            // onClick={() => {
            //   exportToExcel(datasSource, '访问量监控');
            // }}
          >
            导出数据
          </Button>,
        ]}
      />
    </>
  );
};

export default Home;
